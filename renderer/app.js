(function () {
  "use strict";

  const defaults = {
    administrador: { site: true, mobile: true, software: true },
    usuario: { site: true, mobile: true, software: false }
  };

  const validation = window.RecVecValidation;
  let authorized = false;
  let creating = false;
  let me = null;
  let people = [];
  let permissionsReady = false;
  let currentFilter = "todos";
  let searchTerm = "";
  let pendingRoleId = null;
  let pendingAccessId = null;
  let ownProfileUnsubscribe = null;
  let peopleUnsubscribe = null;
  let pendingAuthMessage = "";
  let toastTimer = null;

  const db = () => firebase.firestore();
  const $ = id => document.getElementById(id);
  const now = () => new Date().toISOString();
  const escape = value => String(value || "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[character]));

  function status(id, message, type) {
    const element = $(id);
    if (!element) return;
    element.textContent = message || "";
    element.className = `status${type ? ` ${type}` : ""}${id === "admin-action-status" ? " status-inline" : ""}`;
  }

  function toast(message, error) {
    const element = $("toast");
    clearTimeout(toastTimer);
    element.textContent = message;
    element.className = `toast is-visible${error ? " is-error" : ""}`;
    toastTimer = setTimeout(() => { element.className = "toast"; }, 3600);
  }

  function friendlyError(error) {
    const code = String(error?.code || "");
    const message = String(error?.message || "");
    const detail = `${code} ${message}`.toLowerCase();
    if (detail.includes("permission-denied") || /missing or insufficient permissions/i.test(message)) {
      return "O banco recusou esta ação. Publique novamente as regras e confirme que sua conta está ativa como administradora.";
    }
    if (detail.includes("incomplete-account")) return "A conta foi criada na autenticação, mas o perfil não foi salvo. Peça ao responsável pelo Firebase para verificar o cadastro antes de tentar novamente.";
    if (detail.includes("email-already-in-use")) {
      return "Este e-mail já possui uma conta. Confira a lista de usuários; se não aparecer, peça ao responsável pelo Firebase para verificar o perfil.";
    }
    if (detail.includes("invalid-email") || /e-?mail inv[aá]lido/i.test(message)) return "Digite um e-mail válido.";
    if (detail.includes("invalid-credential") || detail.includes("invalid-login-credentials") || detail.includes("wrong-password") || detail.includes("user-not-found")) {
      return "E-mail ou senha incorretos.";
    }
    if (detail.includes("weak-password")) return "A senha temporária precisa ter pelo menos 6 caracteres.";
    if (detail.includes("too-many-requests")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    if (detail.includes("network-request-failed")) return "Sem conexão com o Firebase. Confira sua internet.";
    return "Não foi possível concluir a operação. Tente novamente.";
  }

  function setButtonBusy(button, busy, busyLabel) {
    if (!button) return;
    if (busy) {
      button.dataset.restoreHtml = button.innerHTML;
      button.disabled = true;
      button.textContent = busyLabel;
      return;
    }
    button.disabled = false;
    if (button.dataset.restoreHtml) button.innerHTML = button.dataset.restoreHtml;
    delete button.dataset.restoreHtml;
  }

  function setView(view) {
    $("login").hidden = view !== "login";
    $("admin").hidden = view !== "admin";
    $("denied").hidden = view !== "denied";
    $("session-bar").hidden = view !== "admin";
    if (view !== "admin") { authorized = false; permissionsReady = false; people = []; document.querySelectorAll("dialog[open]").forEach(dialog => dialog.close()); $("list").replaceChildren(); }
  }

  function clearSubscriptions() {
    ownProfileUnsubscribe?.();
    peopleUnsubscribe?.();
    ownProfileUnsubscribe = null;
    peopleUnsubscribe = null;
  }

  function setPermissionsState(ready, error) {
    permissionsReady = ready && authorized;
    $("admin-alert").hidden = ready;
    $("create-submit").disabled = !permissionsReady || creating || !navigator.onLine;
    if (!ready && error) status("create-status", friendlyError(error));
  }

  function initials(name, email) {
    const source = String(name || email || "U").trim();
    const parts = source.split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? parts[0][0] + parts.at(-1)[0] : source.slice(0, 2)).toUpperCase();
  }

  function roleLabel(role) {
    return role === "administrador" ? "Administrador" : "Usuário";
  }

  function updateStats() {
    const active = people.filter(user => validation.active(user)).length;
    $("stat-total").textContent = people.length;
    $("stat-active").textContent = active;
    $("stat-inactive").textContent = people.length - active;
  }

  function filteredPeople() {
    return people.filter(user => {
      const active = validation.active(user);
      const filterMatches = currentFilter === "todos"
        || (currentFilter === "ativos" && active)
        || (currentFilter === "desativados" && !active);
      const haystack = `${user.nome || ""} ${user.email || ""}`.toLocaleLowerCase("pt-BR");
      return filterMatches && haystack.includes(searchTerm);
    });
  }

  function render() {
    updateStats();
    const results = filteredPeople();
    const list = $("list");
    $("result-count").textContent = `${results.length} de ${people.length} contas`;

    if (!results.length) {
      list.innerHTML = `
        <div class="empty-state">
          <span aria-hidden="true">⌕</span>
          <strong>Nenhuma conta encontrada</strong>
          <p>${people.length ? "Tente outro nome ou altere o filtro selecionado." : "Crie o primeiro usuário pelo formulário ao lado."}</p>
        </div>`;
      return;
    }

    list.innerHTML = results.map((user, index) => {
      const isActive = validation.active(user);
      const isMe = user.id === me?.uid;
      const channels = Object.entries(user.permissoes || {})
        .filter(([, allowed]) => allowed)
        .map(([key]) => `<span class="tag">${escape(({site:"Site",mobile:"Aplicativo",software:"Software"})[key] || key)}</span>`)
        .join("");

      return `
        <article class="person${isActive ? "" : " is-inactive"}" style="--delay:${Math.min(index * 38, 260)}">
          <div class="person-main">
            <span class="avatar">${escape(initials(user.nome, user.email))}</span>
            <div class="person-copy">
              <div class="person-title-row">
                <h3>${escape(user.nome || "Sem nome")}</h3>
                ${isMe ? '<span class="tag">Você</span>' : ""}
              </div>
              <p>${escape(user.email || "E-mail não informado")}</p>
              <div class="person-badges">
                <span class="tag">${escape(roleLabel(user.cargo))}</span>
                ${channels}
                <span class="tag tag-status${isActive ? "" : " off"}">${isActive ? "Ativo" : "Desativado"}</span>
              </div>
            </div>
          </div>
          ${isMe ? "" : `
            <div class="person-actions">
              <button class="action-button" type="button" data-role="${escape(user.id)}">Editar cargo</button>
              <button class="action-button ${isActive ? "danger" : "activate"}" type="button" data-toggle="${escape(user.id)}">
                ${isActive ? "Desativar" : "Reativar"}
              </button>
            </div>`}
        </article>`;
    }).join("");
  }

  async function blockCurrentSession(message) {
    pendingAuthMessage = message;
    clearSubscriptions();
    setView("login");
    status("login-status", message);
    me = null;
    people = [];
    permissionsReady = false;
    await firebase.auth().signOut().catch(() => undefined);
  }

  function watchOwnProfile(user) {
    ownProfileUnsubscribe?.();
    ownProfileUnsubscribe = db().collection("usuarios").doc(user.uid).onSnapshot(snapshot => {
      if (firebase.auth().currentUser?.uid !== user.uid) return;
      const data = snapshot.exists ? snapshot.data() : null;
      if (!data || data.ativo !== true) {
        void blockCurrentSession("Este acesso foi desativado pelo administrador.");
        return;
      }
      if (!validation.canAdmin(data)) {
        peopleUnsubscribe?.();
        peopleUnsubscribe = null;
        setView("denied");
        return;
      }
      authorized = true;
      if ($("admin").hidden) {
        setView("admin");
        watchPeople();
      }
    }, error => {
      void blockCurrentSession(friendlyError(error));
    });
  }

  function watchPeople() {
    peopleUnsubscribe?.();
    peopleUnsubscribe = db().collection("usuarios").orderBy("nome").onSnapshot(snapshot => {
      people = snapshot.docs.map(document => ({ id: document.id, ...document.data() }));
      render();
      setPermissionsState(true);
    }, error => {
      people = [];
      render();
      setPermissionsState(false, error);
    });
  }

  async function showAdmin(user) {
    clearSubscriptions();
    me = user;
    let own = await db().collection("usuarios").doc(user.uid).get();
    if (!own.exists) {
      await blockCurrentSession("Sua conta não possui um perfil de acesso. Peça ao administrador para verificar seu cadastro.");
      return;
    }

    if (firebase.auth().currentUser?.uid !== user.uid) return;
    const data = own.data();
    if (!data || data.ativo !== true) {
      await blockCurrentSession("Este acesso foi desativado pelo administrador.");
      return;
    }

    $("session").textContent = user.email || "Administrador";
    watchOwnProfile(user);

    if (!validation.canAdmin(data)) {
      setView("denied");
      return;
    }

    authorized = true;
    setView("admin");
    status("login-status");
    watchPeople();
  }

  $("login-form").addEventListener("submit", async event => {
    event.preventDefault();
    if (!validateForm(false)) return;
    status("login-status");
    const button = $("login-submit");
    setButtonBusy(button, true, "Verificando acesso...");
    try {
      await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      await firebase.auth().signInWithEmailAndPassword(
        $("login-email").value.trim(),
        $("login-password").value
      );
    } catch (error) {
      status("login-status", friendlyError(error));
    } finally {
      setButtonBusy(button, false);
    }
  });

  async function logout() {
    clearSubscriptions();
    await firebase.auth().signOut();
  }

  $("logout").addEventListener("click", logout);
  $("denied-logout").addEventListener("click", logout);

  $("focus-create").addEventListener("click", () => {
    const card = $("create-card");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.remove("is-highlighted");
    requestAnimationFrame(() => card.classList.add("is-highlighted"));
    setTimeout(() => $("name").focus(), 360);
  });

  $("user-search").addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLocaleLowerCase("pt-BR");
    render();
  });

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(item => { item.classList.toggle("is-active", item === button); item.setAttribute("aria-pressed", String(item === button)); });
      render();
    });
  });

  $("create-form").addEventListener("submit", async event => {
    event.preventDefault();
    if (creating) return;
    if (!canManage()) {
      status("create-status", "Não é possível gerenciar contas agora. Confira a conexão e sua permissão de administrador.");
      return;
    }

    if (!validateForm(true)) return;
    const emailValue = validation.normalizeEmail($("email").value);
    if (people.some(person => validation.normalizeEmail(person.email) === emailValue)) { fieldError("email", "Este e-mail já está cadastrado. Localize a conta na lista."); $("email").focus(); return; }
    const nameValue = $("name").value.trim();
    const passwordValue = $("password").value;
    creating = true;
    const button = $("create-submit");
    setButtonBusy(button, true, "Criando usuário...");
    status("create-status", "Criando a conta e aplicando as permissões...", "loading");
    let secondaryApp = null;
    let createdUser = null;

    try {
      const email = emailValue;
      const role = $("role").value;
      secondaryApp = firebase.initializeApp(firebase.app().options, `new-user-${Date.now()}`);
      const credential = await secondaryApp.auth().createUserWithEmailAndPassword(email, passwordValue);
      createdUser = credential.user;

      try {
        await db().collection("usuarios").doc(createdUser.uid).set({
          nome: nameValue,
          email,
          cargo: role,
          permissoes: defaults[role],
          ativo: true,
          criado_em: now(),
          criado_por: me.uid
        });
      } catch (firestoreError) {
        try {
          await createdUser.delete();
          createdUser = null;
        } catch (rollbackError) {
          console.error("Não foi possível desfazer a conta incompleta:", rollbackError);
        }
        if (createdUser) throw { code: "incomplete-account" };
        throw firestoreError;
      }

      event.target.reset();
      updateRolePreview();
      status("create-status", "Usuário criado e acesso liberado.", "ok");
      toast("Usuário criado com sucesso.");
    } catch (error) {
      status("create-status", friendlyError(error));
    } finally {
      try {
        await secondaryApp?.auth().signOut();
        await secondaryApp?.delete();
      } catch (_) {}
      setButtonBusy(button, false);
      creating = false;
      button.disabled = !canManage();
    }
  });

  function openRoleDialog(user) {
    pendingRoleId = user.id;
    $("role-dialog-title").textContent = `Cargo de ${user.nome || user.email}`;
    $("role-dialog-copy").textContent = "O cargo define quais canais e ferramentas ficam disponíveis para esta conta.";
    $("role-dialog-select").value = defaults[user.cargo] ? user.cargo : "usuario";
    status("role-status");
    $("role-dialog").showModal();
  }

  function openAccessDialog(user) {
    pendingAccessId = user.id;
    const isActive = validation.active(user);
    $("access-dialog-title").textContent = isActive ? `Desativar ${user.nome || user.email}?` : `Reativar ${user.nome || user.email}?`;
    $("access-dialog-copy").textContent = isActive
      ? "A conta continuará cadastrada, mas deixará de consultar ou alterar os dados da oficina."
      : "A conta voltará a acessar os canais permitidos pelo cargo atual.";
    $("access-confirm").textContent = isActive ? "Desativar acesso" : "Reativar acesso";
    $("access-confirm").className = `button ${isActive ? "button-danger" : "button-primary"}`;
    document.querySelector(".access-warning").hidden = !isActive;
    status("access-status");
    $("access-dialog").showModal();
  }

  $("list").addEventListener("click", event => {
    const button = event.target.closest("button[data-role], button[data-toggle]");
    if (!button || !canManage()) return;
    const id = button.dataset.role || button.dataset.toggle;
    const user = people.find(item => item.id === id);
    if (!user) return;
    if (button.dataset.role) openRoleDialog(user);
    else openAccessDialog(user);
  });

  $("role-form").addEventListener("submit", async event => {
    event.preventDefault();
    const user = people.find(item => item.id === pendingRoleId);
    if (!user) return $("role-dialog").close();
    if (!canManage() || user.id === me.uid || $("role-save").disabled) return;
    const role = $("role-dialog-select").value;
    if (!defaults[role]) return status("role-status", "Selecione um cargo válido.");
    const button = $("role-save");
    setButtonBusy(button, true, "Salvando...");
    status("role-status", "Atualizando permissões...", "loading");
    try {
      await db().collection("usuarios").doc(user.id).update({
        cargo: role,
        permissoes: defaults[role],
        atualizado_em: now(),
        atualizado_por: me.uid
      });
      $("role-dialog").close();
      toast(`Cargo de ${user.nome || user.email} atualizado.`);
    } catch (error) {
      status("role-status", friendlyError(error));
    } finally {
      setButtonBusy(button, false);
    }
  });

  $("access-form").addEventListener("submit", async event => {
    event.preventDefault();
    const user = people.find(item => item.id === pendingAccessId);
    if (!user) return $("access-dialog").close();
    if (!canManage() || user.id === me.uid || $("access-confirm").disabled) return;
    const willActivate = !validation.active(user);
    const button = $("access-confirm");
    setButtonBusy(button, true, willActivate ? "Reativando..." : "Desativando...");
    status("access-status", willActivate ? "Restaurando o acesso..." : "Interrompendo o acesso...", "loading");
    try {
      await db().collection("usuarios").doc(user.id).update({
        ativo: willActivate,
        atualizado_em: now(),
        atualizado_por: me.uid,
        acesso_revogado_em: willActivate ? null : now()
      });
      $("access-dialog").close();
      const message = willActivate
        ? `Acesso de ${user.nome || user.email} reativado.`
        : `Acesso de ${user.nome || user.email} desativado. O perfil de acesso foi atualizado.`;
      status("admin-action-status", message, "ok");
      toast(message);
    } catch (error) {
      status("access-status", friendlyError(error));
    } finally {
      setButtonBusy(button, false);
    }
  });

  document.querySelectorAll("[data-close-dialog]").forEach(button => {
    button.addEventListener("click", () => { const dialog = $(button.dataset.closeDialog); if (!dialog.querySelector('button[type="submit"]').disabled) dialog.close(); });
  });


  function canManage() { return authorized && permissionsReady && me?.uid === firebase.auth().currentUser?.uid && navigator.onLine; }
  function fieldError(id, message) {
    const input = $(id);
    let output = $(id + '-error');
    if (!output) { output = document.createElement('small'); output.id = id + '-error'; output.className = 'field-error'; output.setAttribute('aria-live', 'polite'); input.after(output); input.setAttribute('aria-describedby', output.id); }
    output.textContent = message || '';
    input.setAttribute('aria-invalid', String(Boolean(message)));
  }
  function validateForm(creation, focus = true, onlyField) {
    const prefix = creation ? '' : 'login-';
    const errors = validation.validate({name: $('name').value, email: $(prefix+'email').value, password: $(prefix+'password').value, role: $('role').value}, creation);
    for (const field of creation ? ['name','email','password','role'] : ['email','password']) if (!onlyField || prefix+field === onlyField) fieldError(prefix+field, errors[field]);
    if (focus && Object.keys(errors).length) $(prefix+Object.keys(errors)[0]).focus();
    return !Object.keys(errors).length;
  }
  function updateRolePreview() {
    $('role-preview').textContent = $('role').value === 'administrador' ? 'Acesso: site, aplicativo e gestão de usuários. Pode alterar os acessos da equipe.' : 'Acesso: site e aplicativo. Não pode gerenciar contas neste software.';
  }
  $('role').addEventListener('change', updateRolePreview);
  updateRolePreview();
  for (const id of ['name','email','password','role','login-email','login-password']) {
    $(id).addEventListener('blur', () => validateForm(!id.startsWith('login-'), false, id));
    $(id).addEventListener('input', () => { if ($(id).getAttribute('aria-invalid') === 'true') validateForm(!id.startsWith('login-'), false, id); });
  }
  for (const id of ['password','login-password']) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'password-toggle'; button.textContent = 'Mostrar senha'; button.setAttribute('aria-pressed','false');
    button.addEventListener('click', () => { const show = $(id).type === 'password'; $(id).type = show ? 'text' : 'password'; button.textContent = show ? 'Ocultar senha' : 'Mostrar senha'; button.setAttribute('aria-pressed',String(show)); });
    $(id).after(button);
  }
  function connection() { $('connection-status').hidden = navigator.onLine; $('create-submit').disabled = !canManage() || creating; }
  window.addEventListener('offline', connection); window.addEventListener('online', connection); connection();
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('cancel', event => { if (dialog.querySelector('button[type="submit"]').disabled) event.preventDefault(); });
  }

  if (!window.firebase?.apps?.length) { status("login-status", "Não foi possível conectar ao serviço. Confira a internet e reabra o software."); $("login-submit").disabled = true; return; }
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      showAdmin(user).catch(async error => {
        clearSubscriptions();
        me = null;
        people = [];
        pendingAuthMessage = friendlyError(error);
        await firebase.auth().signOut().catch(() => undefined);
      });
      return;
    }

    clearSubscriptions();
    me = null;
    people = [];
    permissionsReady = false;
    setView("login");
    $("login-password").value = "";
    status("login-status", pendingAuthMessage);
    pendingAuthMessage = "";
  });
})();

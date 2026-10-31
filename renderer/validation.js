(function (root) {
  'use strict';
  const roles = ['usuario', 'administrador'];
  const normalizeEmail = value => String(value || '').trim().toLowerCase();
  const validEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  function validate(values, creation = false) {
    const errors = {};
    const email = normalizeEmail(values.email);
    if (!validEmail(email)) errors.email = 'Informe um e-mail válido, como nome@empresa.com.';
    if (!values.password) errors.password = 'Informe a senha.';
    if (creation) {
      const name = String(values.name || '').trim();
      if (name.length < 2 || name.length > 100 || !/\p{L}/u.test(name)) errors.name = 'Informe um nome entre 2 e 100 caracteres, com letras.';
      if (String(values.password || '').length < 6 || String(values.password || '').length > 128 || !String(values.password || '').trim()) errors.password = 'Use uma senha de 6 a 128 caracteres; somente espaços não são aceitos.';
      if (!roles.includes(values.role)) errors.role = 'Selecione um cargo válido.';
    }
    return errors;
  }
  const api = { validate, normalizeEmail, active: user => user?.ativo === true, canAdmin: user => user?.ativo === true && user.cargo === 'administrador' && user.permissoes?.software !== false };
  root.RecVecValidation = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);

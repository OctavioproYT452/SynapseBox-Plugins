// Reemplaza /favicon.svg: el router del plugin va antes que los archivos estáticos.
module.exports = api => {
  api.serveFile("/favicon.svg", "icon.svg");
  api.log("favicon reemplazado");
};

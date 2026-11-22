# React + Vite

## Despliegue en AWS Amplify Hosting

1. Desde la consola de Amplify Hosting, conecta el repositorio Git y selecciona la rama **master**. [amplify.yml](amplify.yml) define Node.js 24, la compilación de producción y la publicación desde **dist**.
2. En **Hosting → Environment variables**, configura para **master** las seis variables de URL con los valores de [.env.example](.env.example). Puedes definir **VITE_TENANTS** para personalizar la lista de tenants del registro público. Vite incorpora estas variables al código público del frontend.
3. En **Hosting → Rewrites and redirects → Manage redirects**, agrega esta regla en el editor JSON antes de cualquier regla genérica de 404. La respuesta 200 permite recargar rutas de React Router y conserva las solicitudes de archivos estáticos.

~~~json
[
  {
    "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|html)$)([^.]+$)/>",
    "status": "200",
    "target": "/index.html",
    "condition": null
  }
]
~~~

4. Inicia el despliegue desde la consola. Si el asistente ya inició una compilación antes de guardar las variables, vuelve a desplegar **master** para incorporarlas.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

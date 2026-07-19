/**
 * Applies the saved theme before first paint to avoid a flash.
 * Falls back to the system preference.
 */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem("momento-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

import { render } from "solid-js/web";
import { Router } from "@solidjs/router";
import Root from './Root'

export default () => {
  const root = document.getElementById("app");

  if (!(root instanceof HTMLElement)) {
    throw new Error(
      "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
    );
  }

  render( 
    () => (
      <Router>
          <Root />
      </Router>
    ),
    root
  );
};

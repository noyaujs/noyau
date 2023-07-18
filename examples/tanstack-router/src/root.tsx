import { Link, Outlet } from "@tanstack/router";
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import "./root.css"

export default function Root() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>
        <br />
        <Link to="/test">Test Page</Link>
        <br />
        <Link to="/DoesNotExist">404</Link>
        <br />
      </nav>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <Outlet />
    </>
  )
}
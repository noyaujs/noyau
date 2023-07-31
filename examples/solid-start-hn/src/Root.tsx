import { Routes } from "@solidjs/router";
import { Suspense } from "solid-js/web";
import ErrorBoundary from "solid-start/error-boundary";

import Nav from "./components/nav";
import { FileRoutes } from "#solid-start/router";
import { Body, Head, Html } from "~~/start";
import "./Root.css";

const Root = () => (
  <Html lang="en">
    <Head>
      {/* <Title>SolidStart - Hacker News</Title>
  <Meta charset="utf-8" />
  <Meta name="viewport" content="width=device-width, initial-scale=1" />
  <Meta name="description" content="Hacker News Clone built with Solid & Noyau" />
  <Link rel="manifest" href="/manifest.webmanifest" /> */}
    </Head>
    <Body>
      <Nav />
      <ErrorBoundary>
        <Suspense fallback={<div class="news-list-nav">Loading...</div>}>
          <Routes>
            <FileRoutes />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      {/* <Scripts /> */}
    </Body>
  </Html>
);

export default Root;

import React, { lazy, Suspense } from "react"; // Must be imported for webpack to work
import "./App.css";

const Header = lazy(() => import("HeaderApp/Header"));
const Footer = lazy(() => import("FooterApp/Header"));

function App() {
  return (
    <div className="App">
      <Suspense fallback={<div>Loading Header...</div>}>
        <Header />
      </Suspense>
      <div>My app</div>
      <Suspense fallback={<div>Loading Header...</div>}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default App;

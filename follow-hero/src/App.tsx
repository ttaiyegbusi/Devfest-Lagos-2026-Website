import { Hero } from "./Hero";
import { useLenis } from "./useLenis";

function App() {
  useLenis();

  return (
    <>
      <Hero />
      <section
        style={{
          height: "150vh",
          background: "#111",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        (scroll space to show the hero react to Lenis scroll)
      </section>
    </>
  );
}

export default App;

"use client"

import { useState } from "react"

export default function SentryExamplePage() {
  const [clicked, setClicked] = useState(false)

  function throwError() {
    setClicked(true)
    // @ts-expect-error intentional test error
    myUndefinedFunction()
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Sentry Test Page</h1>
      <p>Clique no botão para disparar um erro de teste e verificar o Sentry.</p>
      <button
        onClick={throwError}
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          background: "#e11d48",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        {clicked ? "Erro disparado!" : "Disparar erro de teste"}
      </button>
    </main>
  )
}

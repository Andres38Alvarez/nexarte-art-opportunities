import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <main>
      <h1>Iniciar sesión</h1>

      <form
        action={async () => {
          "use server"
          await signIn("google", { redirectTo: "/" })
        }}
      >
        <button type="submit">Continuar con Google</button>
      </form>
    </main>
  )
}
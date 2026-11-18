import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = pathname.startsWith("/administrator");

  // Se a rota for protegida, verificar autenticação e sessão ativa
  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get("connect.sid");

    // Se não há cookie e a rota é protegida, redirecionar para o login
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Se há um cookie, validar a sessão no backend
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: "GET",
        headers: {
          Cookie: `connect.sid=${sessionCookie.value}`,
        },
      });

      // Se a sessão não for válida (401, 403), redirecione para o login
      if (!response.ok) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch (error) {
      // Caso o backend esteja inacessível, redirecione para uma página de erro
      console.error("Erro ao validar sessão:", error);
      return NextResponse.redirect(new URL("/error", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|auth|ativar-conta|error).*)",
  ],
};

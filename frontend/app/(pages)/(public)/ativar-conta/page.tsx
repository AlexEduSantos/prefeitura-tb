"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/app/service/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";

const DEFAULT_EXPIRED_MESSAGE =
  "O link de ativação expirou ou já foi utilizado. Entre em contato com o Administrador para solicitar o envio de um novo link.";

function AtivarContaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    let active = true;
    async function validate() {
      if (!token) {
        if (active) {
          setTokenError(DEFAULT_EXPIRED_MESSAGE);
          setCheckingToken(false);
        }
        return;
      }

      try {
        const result = await AuthService.validateActivationToken(token);
        if (active) {
          setUserEmail(result.email);
          setUserName(result.name);
          setTokenError(null);
        }
      } catch (err: unknown) {
        if (active) {
          setTokenError(
            err instanceof Error ? err.message : DEFAULT_EXPIRED_MESSAGE,
          );
        }
      } finally {
        if (active) {
          setCheckingToken(false);
        }
      }
    }

    validate();
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 6) {
      setSubmitError("A senha deve possuir no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("As senhas informadas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      await AuthService.activateAccount(token, password);
      setActivated(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : DEFAULT_EXPIRED_MESSAGE;
      setSubmitError(msg);
      if (msg.toLowerCase().includes("expirou") || msg.toLowerCase().includes("utilizado")) {
        setTokenError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-12 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Ativação de Conta
          </CardTitle>
          <CardDescription>
            Defina sua senha pessoal para concluir a ativação do acesso ao
            painel administrativo.
          </CardDescription>
        </CardHeader>

        {checkingToken ? (
          <CardContent className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Validando link de ativação...</p>
          </CardContent>
        ) : activated ? (
          <CardContent className="space-y-4 py-6 text-center">
            <div className="flex flex-col items-center gap-2 p-4 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <p className="font-semibold">Conta ativada com sucesso!</p>
              <p className="text-sm">
                Sua senha foi definida. Você será redirecionado para a tela de
                login em instantes.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/login">Ir para o Login</Link>
            </Button>
          </CardContent>
        ) : tokenError ? (
          <CardContent className="space-y-4 py-4">
            <div
              role="alert"
              className="flex items-start gap-3 p-4 text-sm font-medium text-destructive bg-destructive/10 rounded-md border border-destructive/20"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>{tokenError}</p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Voltar para o Login</Link>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium text-foreground">
                  Servidor: {userName}
                </p>
                <p className="text-muted-foreground text-xs">{userEmail}</p>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>{submitError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo de 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a senha informada"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                  disabled={submitting}
                />
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting
                  ? "Ativando conta..."
                  : "Definir Senha e Ativar Conta"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function AtivarContaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AtivarContaContent />
    </Suspense>
  );
}

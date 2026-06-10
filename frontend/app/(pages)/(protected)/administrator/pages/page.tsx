"use client";
import { config } from "@/puck.config";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

// Objeto vazio inicial ou os dados vindos do seu banco
const initialData = {};

export default function EditorPage() {
  return (
    <Puck
      config={config}
      data={initialData}
      onPublish={async (data) => {
        // É aqui que você salva a página
        // O parâmetro 'data' é um JSON contendo a estrutura da árvore criada no Puck
        console.log("JSON pronto para ser salvo no banco de dados:", data);

        // Exemplo: await fetch('/api/save-page', { method: 'POST', body: JSON.stringify(data) });
        alert("Página publicada! Verifique o console.");
      }}
    />
  );
}

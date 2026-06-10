import type { Config } from "@puckeditor/core";

type Props = {
  HeadingBlock: { title: string };
  TextBlock: { content: string };
};

export const config: Config<Props> = {
  components: {
    HeadingBlock: {
      fields: {
        title: { type: "text" },
      },
      defaultProps: {
        title: "Novo Título",
      },
      render: ({ title }) => (
        <h1 className="text-3xl font-bold w-full p-2 ">{title}</h1>
      ),
    },
    TextBlock: {
      fields: {
        content: { type: "textarea" },
      },
      defaultProps: {
        content: "Escreva seu texto aqui...",
      },
      render: ({ content }) => <p>{content}</p>,
    },
  },
};

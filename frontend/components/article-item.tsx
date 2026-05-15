import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export function ArticleItem() {
  return (
    <Card className="p-0 border-transparent shadow-none bg-transparent! ring-0!">
      <CardContent className="flex gap-2 p-0">
        <div className="relative aspect-square h-30 bg-gray-500 rounded-lg" />
        <div className="flex flex-col justify-between py-1">
          <p>Categoria</p>
          <CardTitle className="line-clamp-2">
            Title of the Article Title of the ArticleTitle of the ArticleTitle
            of the ArticleTitle of the Article Title of the Article Title of the
            ArticleTitle of the ArticleTitle of the ArticleTitle of the
            ArticleTitle of the ArticleTitle of the ArticleTitle of the Article
          </CardTitle>
          <div className="flex gap-2 items-center">
            <span className="w-5 h-5 rounded-full bg-gray-400" />
            <p className="text-xs">Autor do Artigo</p>
            <p className="text-xs">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

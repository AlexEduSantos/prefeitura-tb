import { IArticle } from "@/app/type/article";
import { Card, CardContent, CardTitle } from "./ui/card";
import { format } from "date-fns";

interface ArticleItemProps {
  article: IArticle;
}

export function ArticleItem({ article }: ArticleItemProps) {
  return (
    <Card className="p-0 border-transparent shadow-none bg-transparent! ring-0!">
      <CardContent className="flex gap-2 p-0">
        <div className="relative aspect-square h-30 bg-gray-500 rounded-lg" />
        <div className="flex flex-col justify-between py-1">
          <p>{article.entity.name}</p>
          <CardTitle className="line-clamp-2">{article.title}</CardTitle>
          <div className="flex gap-2 items-center">
            <span className="w-5 h-5 rounded-full bg-gray-400" />
            <p className="text-xs">{article.author}</p>
            <p className="text-xs">
              {format(new Date(article.createdAt), "dd/MM/yyyy")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

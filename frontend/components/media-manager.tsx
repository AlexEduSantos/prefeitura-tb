import { Card } from "./ui/card";
import { Button } from "./ui/button";

export default function MediaManager() {
  return (
    <Card className="border-primary/20">
      <div className="flex justify-between items-center">
        <div>
          <h1>Gerenciador de Mídia</h1>
        </div>
        <Button variant="secondary">Adicionar</Button>
      </div>
    </Card>
  );
}

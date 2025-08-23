export default function HomePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          English Word Practice
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          効率的な英単語学習でスキルアップしましょう
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          学習を開始
        </button>
        <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
          統計を見る
        </button>
      </div>
    </div>
  );
}
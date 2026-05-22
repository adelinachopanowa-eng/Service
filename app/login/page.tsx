import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-sm space-y-6 px-4 py-10">
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-lg bg-brand text-white">
          <span className="text-xl font-extrabold">П</span>
        </div>
        <h1 className="text-xl font-extrabold text-text">Сервиз на машини</h1>
        <p className="mt-1 text-xs text-soft">
          Влез в системата, за да продължиш
        </p>
      </div>
      <LoginForm nextPath={next ?? "/"} />
    </div>
  );
}

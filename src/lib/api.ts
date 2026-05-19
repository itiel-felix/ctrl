export async function api<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Error en la solicitud"
    );
  }
  return data as T;
}

import { Repo } from "../model";

export async function getRepository(owner: string, repository: string): Promise<Repo> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner.trim()}/${repository.trim()}`, {
      method: "GET",
      headers: {
        Authorization: "Token " + `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`, // TODO: yeah I know... for now is marked as unsecured
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (response.ok) {
      return (await response.json()) as Repo;
    } else {
      return Promise.reject(new Error(response.status.toString())); // TODO: improve error handling
    }
  } catch (error) {
    return Promise.reject(new Error("Call failed")); // TODO: improve error handling
  }
}

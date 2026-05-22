// Exercise 1 — add parameter types and a return type
function multiply(a: number, b:number) {
  return a * b;
}

// Exercise 2 — define an interface for 'user' and add a return type
interface User {
  email: string
  name: string
}
function getUserLabel(user: User) {
  return `${user.name} <${user.email}>`;
}

// Exercise 3 — type the parameter, return type, and the resolved value
async function loadConfig(env:string) {
  const config = await Promise.resolve({
    baseUrl: `https://${env}.example.com`,
  });
  return config;
}

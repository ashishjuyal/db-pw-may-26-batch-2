interface UserCredentials {
  username: string,
  password: string,
}


// Promise<T>


function fetchUser(id: string): Promise<UserCredentials> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ username: `user-${id}@example.com`, password: "secret" });
    }, 2000);
  })
}

async function printUser(id: string) {
  console.log(`Fetching user ${id}...`);

  const user = await fetchUser(id);

  console.log(`Got user: ${user.username}`);
}


printUser("some-id");

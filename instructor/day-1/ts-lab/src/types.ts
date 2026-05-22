const courseName = "PlayWright Automation course";

const sessionNumber: number = 1;

const hasLab: boolean = true;

const topics: string[] = ["TypeScript", "Node.js", "Playwright"];


console.log(courseName);
console.log(sessionNumber);
console.log(hasLab);
console.log(topics);


export interface UserCredentials {
  username: string,
  password: string,
  role? : string //optional
}

export interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

const adminUser: UserCredentials = {
  username: "admin@example.com",
  password: "password",
  role: "admin"
}

const standardUser: UserCredentials = {
  username: "standard_user@example.com",
  password: "password",
}

const sampleProduct: Product = {
  id: "p-001",
  name: "Playwright Course",
  price: 499,
  inStock: true,
};


console.log(adminUser)
console.log(standardUser)
console.log(sampleProduct)
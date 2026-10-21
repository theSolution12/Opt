export interface User {
  id: number;
  name: string;
  email: string | null;
}

export interface AddUserPayload {
  name: string;
  email: string | null;
}

export interface UpdateUserPayload {
  id: number;
  name: string | null;
  email: string | null;
}

let nextId = 1;
export let users: User[] = [];

export const addUser = (payload: AddUserPayload) => {
  const { name, email } = payload;
  const user = {
    id: nextId++,
    name,
    email,
  };
  users.push(user);

  return {
    success: true,
    message: "User creupdatedated",
    user,
  };
};

export const removeUser = (id: number) => {
  const newUsers = users.filter((user) => user.id != id);
  users = newUsers;

  return {
    success: true,
    message: "User removed",
  };
};

export const updateUser = (payload: UpdateUserPayload) => {
  const { name, email, id } = payload;

  let user = users.find((user) => user.id == id);

  if (!user) {
    return {
      success: false,
      message: "User not found",
      user: null,
    };
  }

  user.name = name == null ? user.name : name;
  user.email = email == null ? user.email : email;

  return {
    success: true,
    message: "User updated",
    user,
  };
};

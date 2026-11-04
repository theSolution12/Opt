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

export interface GetUserPayload {
  index: number;
  pageSize: number;
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
    message: "User created",
    user,
  };
};

export const removeUser = (id: number) => {
  const userIndex = users.findIndex((user) => user.id == id);

  if (userIndex === -1) {
    return {
      success: false,
      message: "User not found",
    };
  }

  users.splice(
    users.findIndex((user) => user.id == id),
    1,
  );

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

export const getUsers = (payload: GetUserPayload) => {
  const { index, pageSize } = payload;

  const startIndex = index * pageSize;
  const endIndex =
    startIndex + pageSize > users.length ? users.length : startIndex + pageSize;

  const paginatedUsers = users.slice(startIndex, endIndex);

  return {
    success: true,
    message: "Users retrieved",
    users: paginatedUsers,
  };
};

interface User {
  id: {
    type: String;
    unique: true;
  };
  password: String;
}

export { User };

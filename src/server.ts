import e from "express";
import userRoutes from "./routes/user.route";

const app = e();
const PORT = 8000;

app.use(e.json());

app.use("/api/users", userRoutes);

app.listen(PORT, () => {
  console.log(`Server active on ${PORT}`);
});

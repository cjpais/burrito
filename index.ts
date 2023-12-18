import chalk from "chalk";
import { brainServer } from "./src/server";

const main = async () => {
  console.log(chalk.green(`🧠 ${process.env.BRAIN_NAME} is online`));
  brainServer();
};

main();

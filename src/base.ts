import * as fs from "fs-extra";
import * as path from "path";
import * as spawn from "cross-spawn";
import { pascal } from "case";
import * as ejs from "ejs";
import * as dayjs from "dayjs";
import * as glob from "glob";
import * as chalk from "chalk";
import { IAnswer } from "./interface";
import { getInstallPath, transformFileName } from "./utils";
import config from "./config";
import { execSync } from "child_process";
import * as childProcess from "child_process";

export default class InitFunc {
  projectName: string;
  installPath: string;
  templatePkg: string;
  copyPath: string;
  answers: IAnswer;
  prefix: string;
  useBeta: boolean;
  scope: string;
  gitInstallPath: string;
  originTemplatePkg: string;
  projectScope: string;
  /** 默认生成的导出组件名 */
  exportName: string;
  constructor({ argv, answers, templatePkg, prefix }) {
    this.projectName = argv["_"][0] || "./";
    this.installPath = getInstallPath();
    this.templatePkg = path.join(config.scope, templatePkg);
    this.originTemplatePkg = templatePkg;
    this.copyPath = path.join(process.cwd(), this.projectName);
    this.answers = answers;
    this.prefix = prefix;
    this.useBeta = argv.beta;
    this.scope = config.scope;
    this.projectScope = this.handleProjectScope(this.answers.projectName);
    this.exportName = this.handleExportName(this.answers.projectName);
    this.gitInstallPath = path.join(this.installPath, "cms-template");
  }

  handleProjectScope(name) {
    const result = name.split("/");
    if (result[1]) {
      return result[0];
    }
    return "";
  }

  handleExportName(name) {
    const result = name
      .replace(/[@\-\/]/g, ",")
      .split(",")
      .map((i) => {
        if (i) {
          return i.charAt(0).toUpperCase() + i.slice(1);
        }
      })
      .filter(Boolean)
      .join("");

    return result;
  }

  addPrefix(name) {
    const prefix = this.prefix;
    if (new RegExp(`^${prefix}`).test(name)) {
      return name;
    }
    return `${prefix}-${name}`;
  }
  isDirEmpty(dir) {
    return (
      glob.sync("**", {
        cwd: dir,
        nodir: true,
        dot: true,
      }).length === 0
    );
  }
  ensureInstallPath() {
    fs.ensureDirSync(this.installPath);
  }
  installTpl(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.answers.sourceType === "npm") {
        spawn.sync(
          "npm",
          [
            "install",
            `${this.templatePkg}${this.useBeta ? "@beta" : "@latest"}`,
            "--no-save",
            "--no-package-lock",
            "--no-shrinkwrap",
            `--registry=${config.packageRegistry}`,
          ],
          {
            stdio: "inherit",
            cwd: this.installPath,
          }
        );
        resolve();
      } else {
        if (fs.existsSync(this.gitInstallPath)) {
          fs.removeSync(this.gitInstallPath);
        }
        console.log(chalk.green(`下载源: ${config.gitRepo}`));
        execSync(`git clone ${config.gitRepo}`, { cwd: this.installPath });
        resolve();
      }
    });
  }

  renderTpl() {
    const templatePath =
      this.answers.sourceType === "npm"
        ? path.join(this.installPath, "node_modules", this.templatePkg, "proj")
        : path.join(this.gitInstallPath, "packages", this.originTemplatePkg, "proj");
    const setterName = this.addPrefix(this.answers.projectName);
    const setterComponentName = pascal(setterName);
    const renderData = {
      ...this.answers,
      name: setterName,
      componentName: setterComponentName,
      version: "1.0.0",
      nowDate: dayjs().format("YYYY-MM-DD"),
    };
    fs.ensureDirSync(this.copyPath);
    if (!this.isDirEmpty(this.copyPath)) {
      console.log(chalk.red("需要初始化的项目目录不为空，请清空后重试"));
      return;
    }
    glob
      .sync("**", {
        cwd: templatePath,
        nodir: true,
        dot: true,
        ignore: ["node_modules/**"],
      })
      .forEach((fileName) => {
        const filePath = path.join(templatePath, fileName);
        const fileTpl = fs.readFileSync(filePath, "utf-8");
        const fileContent = ejs.render(fileTpl, renderData);
        const copyPath = path.join(this.copyPath, transformFileName(fileName));
        fs.ensureFileSync(copyPath);
        fs.writeFileSync(copyPath, fileContent);
      });
  }

  initInstallPathPackageJson() {
    const pkgPath = path.join(this.installPath, "package.json");
    const isExist = fs.pathExistsSync(pkgPath);
    if (isExist) return;
    fs.writeFileSync(pkgPath, JSON.stringify({ private: true }, null, " "));
  }

  installDependencies() {
    console.log(chalk.green("安装依赖..."));
    childProcess.spawnSync("npm", ["install"], {
      cwd: this.copyPath,
      stdio: "inherit",
      shell: true,
    });
    console.log(chalk.green("安装依赖成功"));
  }

  async init() {
    console.log(chalk.cyan("正在为你从初始化项目，请稍等..."));
    this.ensureInstallPath();
    this.initInstallPathPackageJson();
    await this.installTpl();
    this.renderTpl();
    this.installDependencies();
  }
}

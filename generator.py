import os
import json
import math
import shutil

# get the current working directory
workingDir = os.getcwd()

baseSitePath = os.path.join(workingDir, "baseSite")

bladesUiPath = os.path.join(workingDir, "bladesUI")

configDirPath = os.path.join(workingDir, "siteConfigs")

commonResPath = os.path.join(workingDir, "commonRes")

outputDirPath = os.path.join(workingDir, "output")

if os.path.exists(outputDirPath):
    for path in os.listdir(outputDirPath):
        fullPath = os.path.join(outputDirPath, path)
        if os.path.isdir(fullPath):
            shutil.rmtree(fullPath)
        else:
            os.remove(fullPath)
else:
    os.makedirs(outputDirPath)

shutil.copytree(commonResPath, os.path.join(outputDirPath, "commonRes"))
shutil.copytree(bladesUiPath, outputDirPath, dirs_exist_ok=True)

for path in os.listdir(configDirPath):
    siteConfigPath = os.path.join(configDirPath, path)
    if os.path.isdir(siteConfigPath):
        configFile = open(os.path.join(siteConfigPath, "config.json"))
        config = json.load(configFile)
        configFile.close()
        siteOutputDir = os.path.join(outputDirPath, "Endless" + config["keyReplacements"]["targetHost"])
        shutil.copytree(baseSitePath, siteOutputDir)
        shutil.copytree(os.path.join(siteConfigPath, "res"), os.path.join(siteOutputDir, "res"), dirs_exist_ok=True)

        indexHtmlFilePath = os.path.join(siteOutputDir, "index.html")
        indexHtmlFile = open(indexHtmlFilePath, "r+")
        indexHtml = indexHtmlFile.read()
        cssFilePath = os.path.join(siteOutputDir, "style.css")
        cssFile = open(os.path.join(siteOutputDir, "style.css"), "r+")
        css = cssFile.read()

        for key, value in config["keyReplacements"].items():
            replacementTarget = "~KEY:" + key + "~"
            indexHtml = indexHtml.replace(replacementTarget, value)
            css = css.replace(replacementTarget, value)

        maxCols = 4
        currentCol = 0
        toggleTable = "<tr>\n"
        getSettingsFunc = "function getSettings() {\n\tlet jsonObj = {}\n"

        for item in config["toggles"]:
            toggleTable += "<td> <input type=\"checkbox\" id=\"{0}Toggle\" title=\"{1}\"> <label for=\"{0}Toggle\" title=\"{1}\">{2}</label> </td>\n".format(item["id"], item["desc"], item["name"])
            currentCol = currentCol + 1
            if currentCol == 4:
                toggleTable += "</tr>\n"
                currentCol = 0

            getSettingsFunc += "\tjsonObj.{0} = document.getElementById(\"{0}Toggle\").checked\n".format(item["id"])

        toggleTable += "</tr>\n"
        getSettingsFunc += "\treturn JSON.stringify(jsonObj)\n}\n"

        indexHtml = indexHtml.replace("~KEY:toggleTableContent~", toggleTable)

        workerFilePath = os.path.join(siteOutputDir, "worker.js")
        workerFile = open(workerFilePath, "a")
        searchLogicFilePath = os.path.join(siteConfigPath, "searchLogic.js")
        searchLogicFile = open(searchLogicFilePath)
        searchLogic = searchLogicFile.read()
        searchLogicFile.close()
        workerFile.seek(0, 2)
        workerFile.write("\n" + searchLogic)
        workerFile.close()

        scriptFilePath = os.path.join(siteOutputDir, "script.js")
        scriptFile = open(scriptFilePath, "a")
        siteFunctionsFilePath = os.path.join(siteConfigPath, "siteFunctions.js")
        siteFunctionsFile = open(siteFunctionsFilePath)
        siteFunctions = siteFunctionsFile.read()
        siteFunctionsFile.close()
        scriptFile.seek(0, 2)
        scriptFile.write("\n" + siteFunctions + "\n\n" + getSettingsFunc)

        scriptFile.close()

        indexHtmlFile.seek(0)
        indexHtmlFile.truncate(0)
        indexHtmlFile.write(indexHtml)
        indexHtmlFile.close()
        cssFile.seek(0)
        cssFile.truncate(0)
        cssFile.write(css)
        cssFile.close()

print("success")
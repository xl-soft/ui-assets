// @deno-types="npm:@types/express@4.17.15"
import express from "https://esm.sh/express@4.18.2?target=denonext";
import * as path from "https://deno.land/std@0.192.0/path/mod.ts";
import __ from "https://deno.land/x/dirname@1.1.2/mod.ts";
import {Request, Response} from "https://esm.sh/express@4.18.2?target=denonext";
import replaceAll from "./utils/replaceAll.ts";
import { exists } from "https://deno.land/std@0.192.0/fs/mod.ts";
const { __filename, __dirname } = __(import.meta);
const app = express();
const iconspath = path.join(__dirname, './icons/').substring(1).split('%20').join(' ')

app.get("/icons/:pack/:category/:icon", async (req: Request , res: Response) => {
    const color = req.query.color || "hex000"
    const size = req.query.size || "50"
    const rotate = req.query.rotate || "0"
    const fill = req.query.fill || "none"
    
    const iconpath = path.join(iconspath, req.params.pack , req.params.category, `${req.params.icon}.svg`)
    let icon
    if (await exists(iconpath) === true) icon = Deno.readTextFileSync(iconpath); else { res.status(404); return }
    icon = replaceAll(icon,` stroke="white"`, ` stroke="${replaceAll(String(color), 'hex', '#')}"`)
    icon = replaceAll(icon,` fill="white"`, ` fill="${replaceAll(String(color), 'hex', '#')}"`)
    icon = replaceAll(icon,` width="50" height="50" `, ` width="${size}" height="${size}" `)
    icon = replaceAll(icon,`<svg `, `<svg style="transform: rotate(${rotate}deg)" `)
    icon = replaceAll(icon,` fill="none" `, ` fill="${replaceAll(String(fill), 'hex', '#')}" `)
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(icon)
});

app.get("/list", (req: Request , res: Response) => {
    const sets = []
    for (const id of Deno.readDirSync(path.join(iconspath))) {
        for (const file of Deno.readDirSync(path.join(iconspath, id.name))) {
            if (file.isFile) {
                const description = JSON.parse(Deno.readTextFileSync(path.join(iconspath, id.name, 'description.json')))
                
                const list = []
                for (const category of Deno.readDirSync(path.join(iconspath, id.name))) {
                    if (category.isDirectory) {
                        const categorypath = path.join(iconspath, id.name, `./${category.name}`)
                        for (const icon of Deno.readDirSync(categorypath)) list.push (icon.name)
                    }
                }
                sets.push({
                    id: id.name,
                    name: description.name,
                    description: description.description,
                    baseurl: `http://${req.headers.host}/icons/${id.name}/`,
                    listurl: `http://${req.headers.host}/list/${id.name}/`,
                    count: list.length
                })
            }
        }

    }
    const license = Deno.readTextFileSync(path.join(__dirname, 'license.md').substring(1).split('%20').join(' '))
    res.json({ name: "XL Assets Icons", license: license, sets: sets })
});

app.get("/list/:pack", (req: Request , res: Response) => {
    const list = []
    for (const category of Deno.readDirSync(path.join(iconspath, req.params.pack))) {
        if (category.isDirectory) {
            const categorypath = path.join(iconspath, req.params.pack, `./${category.name}`)

            for (const icon of Deno.readDirSync(categorypath)) list.push ({ 
                category: category.name, 
                name: icon.name, 
                path: `http://${req.headers.host}/icons/${category.name}/${replaceAll(icon.name, '.svg', '')}`
            })}
    }
    const description = JSON.parse(Deno.readTextFileSync(path.join(iconspath, req.params.pack, 'description.json')))
    res.json({...description, count: list.length, icons: list })
});

app.listen(8000)


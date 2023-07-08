// @deno-types="npm:@types/express@4.17.15"
import express from "https://esm.sh/express@4.18.2?target=denonext";
import __ from "https://deno.land/x/dirname@1.1.2/mod.ts";
import {Request, Response} from "https://esm.sh/express@4.18.2?target=denonext";
import replaceAll from "./utils/replaceAll.ts";
import { exists } from "https://deno.land/std@0.192.0/fs/mod.ts";
const app = express();

app.get("/list", (req: Request , res: Response) => {
    const sets = []
    for (const id of Deno.readDirSync(`./icons`)) {
        const description = JSON.parse(Deno.readTextFileSync(`./icons/${id.name}/description.json`))
        const list = []
        for (const file of Deno.readDirSync(`./icons/${id.name}`)) { if (file.isFile) {
            for (const category of Deno.readDirSync(`./icons/${id.name}`)) { if (category.isDirectory) { 
                for (const icon of Deno.readDirSync(`./icons/${id.name}/${category.name}`)) list.push (icon.name)
            }}
        }}
        sets.push({
            id: id.name,
            name: description.name,
            description: description.description,
            baseurl: `http://${req.headers.host}/icons/${id.name}/`,
            listurl: `http://${req.headers.host}/list/${id.name}/`,
            count: list.length
        })
    }
    res.json({ name: "XL Assets Icons", license: Deno.readTextFileSync('./license.md'), sets: sets })
});

app.get("/list/:pack", (req: Request , res: Response) => {
    const list = []
    for (const category of Deno.readDirSync(`./icons/${req.params.pack}/`)) { if (category.isDirectory) {
        for (const icon of Deno.readDirSync(`./icons/${req.params.pack}/${category.name}`))
        list.push ({ 
            category: category.name, 
            name: icon.name, 
            path: `http://${req.headers.host}/icons/${category.name}/${replaceAll(icon.name, '.svg', '')}`
        })
    }} 
    res.json({...JSON.parse(Deno.readTextFileSync(`./icons/${req.params.pack}/description.json`)), count: list.length, icons: list })
});

app.get("/icons/:pack/:category/:icon", async (req: Request , res: Response) => {
    const color = req.query.color || "hex000"
    const size = req.query.size || "50"
    const rotate = req.query.rotate || "0"
    const fill = req.query.fill || "none"
    let icon
    
    const path = `./icons/${req.params.pack}/${req.params.category}/${req.params.icon}.svg`
    if (await exists(path) === true) icon = Deno.readTextFileSync(path); else icon = Deno.readTextFileSync('./404.svg')
    icon = replaceAll(icon,` stroke="white"`, ` stroke="${replaceAll(String(color), 'hex', '#')}"`)
    icon = replaceAll(icon,` fill="white"`, ` fill="${replaceAll(String(color), 'hex', '#')}"`)
    icon = replaceAll(icon,` width="50" height="50" `, ` width="${size}" height="${size}" `)
    icon = replaceAll(icon,`<svg `, `<svg style="transform: rotate(${rotate}deg)" `)
    icon = replaceAll(icon,` fill="none" `, ` fill="${replaceAll(String(fill), 'hex', '#')}" `)
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(icon)
});

app.listen(8080)


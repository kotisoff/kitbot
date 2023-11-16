const types = (arr = []) => {
    return arr.map(i => {
        if (typeof i === "number" || typeof i === "bigint" || typeof i === "boolean") return (`${i}`).yellow;
        if (typeof i === "function") return `[Function: ${(i.name.length > 0) ? i.name : "(anonymous)"}]`.cyan;
        if (typeof i === "undefined") return "undefined".gray;
        return i;
    })
}

module.exports = class {
    constructor(name = "") {
        this.name = name;
        this.time = ""
    }
    resetTime = () => {
        const dat = new Date();
        const time = [dat.getHours(), dat.getMinutes(), dat.getSeconds()];
        this.time = time.map(i => {
            if (i.toString().length === 1) return "0" + i
            return i
        }).join(":")
        return this;
    }
    info = (...data) => {
        this.resetTime();
        console.log(`[INFO ${this.time}]`, `[${this.name}]`, types(data).join(" ").gray);
        return this;
    }
    warn = (...data) => {
        this.resetTime();
        console.log(`[WARN ${this.time}]`.yellow, `[${this.name}]`, types(data).join(" ").gray);
        return this;
    }
    error = (...data) => {
        this.resetTime();
        console.log(`[ERROR ${this.time}]`.red`[${this.name}]`, types(data).join(" ").gray);
        return this;
    }
}
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
        console.log(`[INFO ${this.time}]`, `[${this.name}]`, ...data);
        return this;
    }
    warn = (...data) => {
        this.resetTime();
        console.log(`[WARN ${this.time}]`.yellow, `[${this.name}]`, ...data);
        return this;
    }
    error = (...data) => {
        this.resetTime();
        console.log(`[ERROR ${this.time}]`.red, `[${this.name}]`, ...data);
        return this;
    }
}
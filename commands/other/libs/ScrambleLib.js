module.exports = {
    Alphabets: {
        default:
            'qwertyuiopasdfghjklzxcvbnm1234567890где ёж_сукайцншщзхъфывпролэячмитьбю.,?/""\\*-+~!@#%*()-+;:`[]{}',
        murka124: ` abcdefghijklmnopqrstuvwxyz0123456789абвгдеёжзийклмнопрстуфхцчшщъыьэюя[{'":;<,>./?|\=+-_)(*&^%$#№@!`,
        reallike:
            'абвгдеёжзийклмнопрстуфхцчщъыьэюя 1234567890abcdefghijklmnopqrstuvwxyz.,?/""*-+~!@#%*()_-+;:`[]{}~',
        all: "all",
    },
    decrypt(input, alphabet) {
        let decrypted = "";
        for (let i = 0; i < input.length; i += 2) {
            decrypted += alphabet.charAt(
                parseInt(input.charAt(i) + input.charAt(i + 1)) - 1
            );
            // console.log(
            //   input.charAt(i) +
            //     input.charAt(i + 1) +
            //     " converted to " +
            //     alphabet.charAt(parseInt(input.charAt(i) + input.charAt(i + 1)))
            // );
        }
        return decrypted;
    },
    encrypt(input, alphabet) {
        let decrypted = "";
        for (let i = 0; i < input.length; i += 2) {
            decrypted += alphabet.charAt(
                parseInt(input.charAt(i) + input.charAt(i + 1)) - 1
            );
            // console.log(
            //   input.charAt(i) +
            //     input.charAt(i + 1) +
            //     " converted to " +
            //     alphabet.charAt(parseInt(input.charAt(i) + input.charAt(i + 1)))
            // );
        }
        return decrypted;
    }
}
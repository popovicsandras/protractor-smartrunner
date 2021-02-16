export function isCliGrepped() {
    return process.argv.some((argument) => /^-g=/.test(argument) || /^--grep=/.test(argument));
}

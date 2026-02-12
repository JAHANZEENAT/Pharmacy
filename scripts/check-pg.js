
try {
    require('pg');
    console.log("pg is available");
} catch (e) {
    console.log("pg is NOT available");
}

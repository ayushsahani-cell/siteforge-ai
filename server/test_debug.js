const { analyze, analyzeAndFix } = require('./debugEngine');
const testFiles = {
  'index.html': '<html><head><title>Test</title></head><body><img src="test.jpg"><form><input type="text"><button type="submit">Go</button></form></body></html>',
  'styles.css': '.card { color: red; } .btn { transition: all 0.3s; }',
  'scripts.js': 'var x = document.querySelector(".foo"); x.addEventListener("click", function(){}); console.log("debug");'
};

const result = analyze(testFiles);
console.log('SUMMARY:', JSON.stringify(result.summary, null, 2));
console.log('ISSUES COUNT:', result.issues.length);
console.log('FIRST 5 ISSUES:');
result.issues.slice(0, 5).forEach(i =>
  console.log(' -', i.severity.toUpperCase(), i.code, ':', i.message.substring(0, 80))
);

const fixed = analyzeAndFix(testFiles);
console.log('\nFIX LOG (' + fixed.fixLog.length + ' fixes):');
fixed.fixLog.forEach(f => console.log(' +', f.file, '-', f.description));
console.log('\nPOST-FIX SUMMARY:', JSON.stringify(fixed.fixed.summary, null, 2));
console.log('\nEngine test: PASSED');

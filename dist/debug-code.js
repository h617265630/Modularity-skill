// Debug generated code
import { FeatureCompiler } from './core/compiler.js';
async function debug() {
    const compiler = new FeatureCompiler();
    const result = await compiler.compile('/comment-m');
    console.log('=== BACKEND CODE ===');
    console.log(result.code_patch.backend);
    console.log('\n=== DATABASE CODE ===');
    console.log(result.code_patch.database);
}
debug().catch(console.error);
//# sourceMappingURL=debug-code.js.map
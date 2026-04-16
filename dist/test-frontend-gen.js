// Test frontend code generation
import { FeatureCompiler } from './core/compiler.js';
async function testFrontend() {
    const compiler = new FeatureCompiler();
    console.log('🎨 Frontend Code Generation Test\n');
    console.log('='.repeat(60));
    // Test /comment-m
    console.log('\n📦 /comment-m Frontend:\n');
    const comment = await compiler.compile('/comment-m');
    console.log(comment.code_patch.frontend.substring(0, 2000));
    console.log('\n...');
    // Test /user-m
    console.log('\n\n📦 /user-m Frontend:\n');
    const user = await compiler.compile('/user-m');
    console.log(user.code_patch.frontend.substring(0, 2000));
    console.log('\n...');
    // Test /like
    console.log('\n\n📦 /like Frontend:\n');
    const like = await compiler.compile('/like');
    console.log(like.code_patch.frontend.substring(0, 1500));
}
testFrontend().catch(console.error);
//# sourceMappingURL=test-frontend-gen.js.map
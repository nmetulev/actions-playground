// uploadArtifact token version

const { Octokit } = require("@octokit/rest");
const fs = require('fs');

if (process.argv.length < 4) {
    console.log('usage: uploadSpfxSolution <github_token> <package_version>');
    
    return;
}

const auth = process.argv[2];
const version = process.argv[3];
const repo = 'actions-playground';
const owner = 'nmetulev';

const octokit = new Octokit({auth});

(async () => {

    const releases = await octokit.rest.repos.listReleases({
        owner,
        repo
    })
    
    const filteredReleases = releases.data.filter(r => r.name.includes(version));
    let release;

    if (!filteredReleases.length) {
        release = (await octokit.rest.repos.createRelease({
            owner,
            repo,
            tag_name: 'v' + version,
            name: 'v' + version,
            draft: true
        })).data;
    } else {
        release = filteredReleases[0];
    }

    const file = fs.readFileSync('solution/mgt-spfx.sppkg');

    const name = `mgt-spfx-${version}.sppkg`;

    if (release.assets && release.assets.length) {
        const asset = release.assets.filter(a => a.name === name)[0];
        if (asset) {
            console.log('deleting asset', asset)
            await octokit.rest.repos.deleteReleaseAsset({
                owner,
                repo,
                asset_id: asset.id
            });
        }
    }

    await octokit.rest.repos.uploadReleaseAsset({
        owner,
        repo,
        release_id: release.id,
        data: file,
        name: `mgt-spfx-${version}.sppkg`
    });
})();
module.exports = {
    "productName": "ti_revived_server",
    "appId": "org.erb.TacticalInterventionRevivedDS",
    "asar": true,
    "asarUnpack": [
        "**\\*.{node,dll}"
    ],
    "files": [
        "dist",
        "node_modules",
        "package.json"
    ],
    "extraFiles": [
        {
            "from": "assets_bin",
            "to": "",
            "filter": [
                "**/*"
            ]
        }
    ],
    "afterSign": ".erb/scripts/notarize.js",
    "mac": {
        "target": {
            "target": "default",
            "arch": [
                "arm64",
                "x64"
            ]
        },
        "type": "distribution",
        "hardenedRuntime": true,
        "entitlements": "assets/entitlements.mac.plist",
        "entitlementsInherit": "assets/entitlements.mac.plist",
        "gatekeeperAssess": false
    },
    "dmg": {
        "contents": [
            {
                "x": 130,
                "y": 220
            },
            {
                "x": 410,
                "y": 220,
                "type": "link",
                "path": "/Applications"
            }
        ]
    },
    "nsis": {
        "oneClick": false,
        "allowToChangeInstallationDirectory": true,
        "perMachine": true,
        "warningsAsErrors": false,
        "include": ".erb/scripts/installer.nsh"
    },
    "win": {
        "requestedExecutionLevel": "asInvoker",
        "target": [
            "nsis"
        ]
    },
    "linux": {
        "target": [
            "AppImage"
        ],
        "category": "Development"
    },
    "directories": {
        "app": "release/app",
        "buildResources": "assets",
        "output": "release/build"
    },
    "extraResources": [
        "./assets/**"
    ],
    "publish": {
        "provider": "github",
        "owner": "vingard",
        "repo": "Tactical-Intervention-Revived"
    },
    "extraMetadata": {
        "isDedicatedServer": true
    }
}

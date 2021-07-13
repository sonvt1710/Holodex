import { LayoutItem } from "@/external/vue-grid-layout/src/helpers/utils";

export interface Content {
    id: string;
    type: string;
    isTwitch?: Boolean;
    video?: Object;
    playerControls?: Object;
    currentTab?: Number;
}

const b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.";
/**
 * Encodes a layout array and contents to a compact URI
 * @param {{layout, contents, includeVideo?}} layout and layout contents
 * @returns {string} encoded string
 */
export function encodeLayout({ layout, contents, includeVideo = false }) {
    const l = [];
    try {
        layout.forEach((item) => {
            let encodedBlock = "";
            let invalid = false;
            ["x", "y", "w", "h"].forEach((key) => {
                if (item[key] >= 64) {
                    invalid = true;
                } else {
                    encodedBlock += b64[item[key]];
                }
            });

            if (invalid) return;

            if (contents[item.i]) {
                const { id, type, isTwitch, video, currentTab } = contents[item.i];
                if (type === "chat") {
                    encodedBlock += `chat${currentTab || 0}`;
                } else if (type === "video" && includeVideo) {
                    if (isTwitch) {
                        encodedBlock += `twitch${id}`;
                    } else {
                        encodedBlock +=
                            id + (video.channel.english_name || video.channel.name.split(/[/\s]/)[0].replace(",", ""));
                    }
                }
            }
            l.push(encodedBlock);
        });
        return l.join(",");
    } catch (e) {
        console.error(e);
        return "error";
    }
}

/**
 * Decodes a string to layout array and contents
 * @param {string} encodedStr encoded string
 * @returns {{layout, content}} layout and layout contents as array and object
 */
export function decodeLayout(encodedStr) {
    const parsedLayout = [];
    const parsedContent = {};
    encodedStr.split(",").forEach((str, index) => {
        const xywh = str.substring(0, 4);
        const idOrChat = str.substring(4, 15);
        const isChat = idOrChat.substring(0, 4) === "chat";
        const isTwitch = idOrChat.substring(0, 6) === "twitch";
        const channelName = str.substring(15);

        const keys = ["x", "y", "w", "h"];
        const layoutItem: LayoutItem = { w: 0, h: 0, x: 0, y: 0, i: index };

        xywh.split("").forEach((char, keyIndex) => {
            const num = b64.indexOf(char);
            layoutItem[keys[keyIndex]] = num;
        });

        layoutItem.i = index;
        if (isChat) {
            const currentTab = idOrChat.length === 5 ? Number(idOrChat[4]) : 0;
            parsedContent[index] = {
                type: "chat",
                currentTab,
            };
        } else if (isTwitch) {
            const twitchChannel = str.substring(10);
            parsedContent[twitchChannel] = {
                type: "video",
                // content: {
                id: twitchChannel,
                isTwitch: true,
                video: {
                    id: twitchChannel,
                    type: "twitch",
                    channel: {
                        name: twitchChannel,
                    },
                },
                // },
            };
            layoutItem.i = twitchChannel;
        } else if (idOrChat.length === 11) {
            parsedContent[idOrChat] = {
                type: "video",
                // content: {
                id: idOrChat,
                video: {
                    id: idOrChat,
                    channel: {
                        name: channelName,
                    },
                },
                // },
            };
            layoutItem.i = idOrChat;
        }
        parsedLayout.push(layoutItem);
    });
    // console.log(parsedLayout, parsedContent);
    return {
        layout: parsedLayout,
        content: parsedContent,
    };
}

/**
 * Count the number of empty cells
 * @param {{layout, content}} layout and layout contents
 * @returns {number} count of empty cells
 */
export function getEmptyCells({ layout, content }) {
    return layout.length - Object.values(content).filter((o: Content) => o.type === "chat").length;
}

export const desktopPresets = Object.freeze([
    { layout: "AAVY,VADYchat0", name: "Side Chat 1", emptyCells: 1 },
    { layout: "AARM,AMRM,RAHYchat", name: "Side Chat 2" },
    { layout: "AAOM,AMOM,OAFYchat,TAFYchat", name: "2 Video, 2 Chat", emptyCells: 2 },
    { layout: "AAMY,MAMM,MMMM", name: "p1s2", emptyCells: 3 },
    { layout: "AAMM,AMMM,MAMM,MMGMchat,SMGMchat", name: "3 Video, 2 Chat" },
    { layout: "AAMM,AMMM,MAMM,MMMM", name: "2 x 2" },
    { layout: "AADMchat0,DAJM,MAJM,VADMchat0,DMJM,MMJM,AMDMchat0,VMDMchat0", name: "2x2 4 Chat", emptyCells: 4 },
    { layout: "PAJM,AAJM,AMJM,PMJM,JADMchat0,JMDMchat0,MADMchat0,MMDMchat0", name: "2 chat 2" },
    { layout: "SAGYchat,AAJM,AMJM,JAJM,JMJM", name: "2x2 1 Chat" },
    { layout: "AAIM,AMIM,IAIM,QMIM,QAIM,MMEMchat0,IMEMchat0", name: "5 Video", emptyCells: 5 },
    { layout: "AAIM,AMIM,IAIM,IMIM,QAIM,QMIM", name: "2 x 3", emptyCells: 6 },
    { layout: "AAQQ,AQII,IQII,QAII,QIII,QQII", name: "p1s5" },
    { layout: "AAJM,AMJM,JAJM,JMJM,SAGI,SIGI,SQGI", name: "7 Videos", emptyCells: 7 },
    { layout: "AAII,AIII,AQII,IAII,IIII,IQII,QAII,QIII,QQII", name: "3 x 3", emptyCells: 9 },
    {
        layout: "AAGI,GAGI,MAGI,AIGI,GIGI,MIGI,AQGI,GQGI,MQGI,SAGYchat",
        name: "3x3 1 Chat",
    },
    {
        layout: "AAHI,AQHI,AIHI,HAHI,HIHI,HQHI,OAHI,OIHI,OQHI,VIDIchat0,VADIchat0,VQDIchat0",
        name: "3x3 3 Chat",
    },
    { layout: "AAML,MAML,ALGH,GLGH,MLGH,SLGH,ASGG,GSGG,MSGG,SSGG", name: "Among Us 1", emptyCells: 10 },
    { layout: "AAKL,KAKL,UAEYchat,ALFH,FLFH,KLFH,PLFH,ASFG,FSFG,KSFG,PSFG", name: "Among Us 2" },
    { layout: "AASR,SAGYchat,ARGH,GRGH,MRGH", name: "Sports Fes 1" },
    {
        layout: "AAMM,SAGYchat,AMGG,ASGG,GMGG,GSGG,MAGG,MGGG,MMGG,MSGG",
        name: "Sports Fes 2",
    },
    { layout: "GAMM,GMMM,AAGG,AGGG,AMGG,ASGG,SAGG,SGGG,SMGG,SSGG", name: "Sports Fes 3" },
]);

export const mobilePresets = Object.freeze([
    { layout: "AAYI,AIYQchat0", name: "Mobile 1", emptyCells: 1 },
    { layout: "AOYKchat,AAYH,AHYH", name: "Mobile 2", emptyCells: 2 },
    { layout: "AAYI,AIYI,AQYI", name: "Mobile 3", emptyCells: 3 },
    { layout: "MAMY,AAMM,AMMM", name: "Mobile 3L", landscape: true },
    { layout: "AAMM,AMMM,MAMM,MMMM", name: "Mobile 4", emptyCells: 4, landscape: true },
]);

// Auxilary function for making sure the biggest and left most cells are first
// export function sortPresets(presets) {
//     return  presets.map(obj => {
//         const { layout, content } = decodeLayout(obj.layout);
//         // console.log(content);
//         const withContent = layout.map(x => {
//             return {
//                 ...x,
//                 c: content[x.i]
//             }
//         });

//         withContent.sort( (a,b) => {
//             return b.w*b.h - a.w*a.h || (a.x) - (b.x) || a.y - b.y;
//         });

//         const newContent = {};
//         const remapped =  withContent.map((obj2, index) => {
//             obj2.i = index;
//             if(obj2.c) {
//                 newContent[index] = obj2.c;
//             }
//             delete obj2.c;
//             return obj2;
//         });

//         return {
//             ...obj,
//             layout: encodeLayout({
//                 layout: remapped,
//                 contents: newContent,
//             }),
//         };
//     });
// }

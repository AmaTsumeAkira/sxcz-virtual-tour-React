export interface Level {
  tileSize: number;
  size: number;
  fallbackOnly?: boolean;
}

export interface ViewParameters {
  yaw: number;
  pitch: number;
  fov: number;
}

export interface LinkHotspot {
  yaw: number;
  pitch: number;
  rotation: number;
  target: string;
}

export interface InfoHotspot {
  yaw: number;
  pitch: number;
  title: string;
  text: string;
}

export interface Scene {
  id: string;
  name: string;
  levels: Level[];
  faceSize: number;
  initialViewParameters: ViewParameters;
  linkHotspots: LinkHotspot[];
  infoHotspots: InfoHotspot[];
  audio?: string; // 场景讲解语音文件路径
}

export interface AppData {
  scenes: Scene[];
  name: string;
  settings: {
    mouseViewMode: string;
    autorotateEnabled: boolean;
    fullscreenButton: boolean;
    viewControlButtons: boolean;
  };
}

export const APP_DATA: AppData = {
  "scenes": [
    {
      "id": "0-",
      "name": "云游财专-南院东门",
      "audio": "audio/南校东门门口介绍.mp3",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": 0.11048374705625363, "pitch": -0.36992654701665906, "fov": 1.5091423593016802 },
      "linkHotspots": [
        { "yaw": 0.029958915754658477, "pitch": 0.08089849214157319, "rotation": 0, "target": "2-" }
      ],
      "infoHotspots": [
        {
          "yaw": 0.7512953754929903,
          "pitch": -0.1303135796336008,
          "title": "山西省财政税务专科学校",
          "text": "首批国家示范性高等职业院校，国家优质专科高等职业院校，山西唯一中国特色高水平高职学校建设单位，取得国家级标志性成果300余项，长期稳居全国职业教育第一方阵。"
        }
      ]
    },
    {
      "id": "1-",
      "name": "云游财专-南院南门",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": 0.041242369310829474, "pitch": -0.34017551871858664, "fov": 1.5091423593016802 },
      "linkHotspots": [
        { "yaw": -0.016936237216064853, "pitch": 0.013827994270634747, "rotation": 0, "target": "3-" }
      ],
      "infoHotspots": [
        {
          "yaw": 0.7403786880330294,
          "pitch": -0.40652073069248296,
          "title": "山西省财政税务专科学校",
          "text": "首批国家示范性高等职业院校<div>国家优质专科高等职业院校</div><div>山西唯一中国特色高水平高职学校建设单位</div><div>取得国家级标志性成果300余项</div><div>长期稳居全国职业教育第一方阵。</div>"
        }
      ]
    },
    {
      "id": "2-",
      "name": "云游财专-东西道路",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": 0.05381200312631229, "pitch": -0.10847031750928515, "fov": 1.2651582654904927 },
      "linkHotspots": [
        { "yaw": 1.0710295875017906, "pitch": 0.10216198826302403, "rotation": 0, "target": "14-" },
        { "yaw": -0.026066323499158273, "pitch": 0.011716204170079791, "rotation": 0, "target": "4-" },
        { "yaw": 3.098523363389541, "pitch": 0.010535922330184633, "rotation": 0, "target": "0-" }
      ],
      "infoHotspots": [
        { "yaw": -1.857697899232802, "pitch": -0.3058531308984964, "title": "我校一号教学楼", "text": "设有智慧教室、实训室等" }
      ]
    },
    {
      "id": "3-",
      "name": "云游财专-南门十字路口",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": 0.08626815563968293, "pitch": 0.027306612620282777, "fov": 1.111223863084898 },
      "linkHotspots": [
        { "yaw": 1.4667239348575203, "pitch": -0.020453116662270787, "rotation": 4.71238898038469, "target": "10-" },
        { "yaw": 0.5326751262532454, "pitch": -0.09831200559305842, "rotation": 5.497787143782138, "target": "6-" },
        { "yaw": -0.8422329825547905, "pitch": 0.02163894473272343, "rotation": 0, "target": "15-" },
        { "yaw": 0.031500253387537924, "pitch": 0.021209582285022677, "rotation": 0, "target": "1-" },
        { "yaw": -2.9624274166317104, "pitch": 0.08498639900604132, "rotation": 0, "target": "4-" }
      ],
      "infoHotspots": [
        { "yaw": -0.9823494965436232, "pitch": 0.12078084199051631, "title": "这有一只三花猫", "text": "🐱" }
      ]
    },
    {
      "id": "4-",
      "name": "云游财专-东门十字路口",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": -0.023971181997421098, "pitch": 0.19160440334697348, "fov": 1.5091423593016802 },
      "linkHotspots": [
        { "yaw": -1.6395764593916855, "pitch": 0.07872550553465629, "rotation": 0, "target": "3-" },
        { "yaw": 0.008727296005593743, "pitch": -0.018880914574227248, "rotation": 0, "target": "12-" },
        { "yaw": 0.6023605193699453, "pitch": 0.1387676180142563, "rotation": 0, "target": "5-" },
        { "yaw": 3.095157744798758, "pitch": 0.25954136549923135, "rotation": 0, "target": "4-" },
        { "yaw": 2.23391666372002, "pitch": 0.13474640219623701, "rotation": 0, "target": "14-" }
      ],
      "infoHotspots": []
    },
    {
      "id": "5-",
      "name": "云游财专-青年广场",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": 0.1266093233142005, "pitch": 0.10994608425417596, "fov": 1.5091423593016802 },
      "linkHotspots": [
        { "yaw": 0.037842506910735096, "pitch": -0.025682311113889966, "rotation": 0, "target": "8-" },
        { "yaw": -0.8549697961618818, "pitch": -0.028029503786171972, "rotation": 0, "target": "12-" },
        { "yaw": -3.085187377626175, "pitch": -0.022360029770798207, "rotation": 0, "target": "14-" },
        { "yaw": 1.6169337497161846, "pitch": 0.03111820614662264, "rotation": 0, "target": "11-2" },
        { "yaw": 0.4625431468618171, "pitch": 0.01915302475764591, "rotation": 0, "target": "9-" }
      ],
      "infoHotspots": [
        { "yaw": 1.560294331257774, "pitch": -0.2505470598945365, "title": "二号教学楼", "text": "设有阶梯教室等" }
      ]
    },
    {
      "id": "6-",
      "name": "云游财专-办公楼平台",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "pitch": 0, "yaw": 0, "fov": 1.5707963267948966 },
      "linkHotspots": [
        { "yaw": 2.14606286048902, "pitch": -0.02932604289419416, "rotation": 4.71238898038469, "target": "3-" },
        { "yaw": -2.131653776263475, "pitch": -0.033674912870916174, "rotation": 1.5707963267948966, "target": "1-" },
        { "yaw": -2.924900899461763, "pitch": -0.03919967264817714, "rotation": 0, "target": "15-" },
        { "yaw": -0.019237299348072057, "pitch": 0.5212398135907463, "rotation": 3.141592653589793, "target": "10-" }
      ],
      "infoHotspots": []
    },
    {
      "id": "7-",
      "name": "云游财专-操场（篮球场）",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": -0.05738068773679217, "pitch": 0.22599072921862984, "fov": 1.5091423593016802 },
      "linkHotspots": [
        { "yaw": -1.273850425709039, "pitch": -0.04296243172132996, "rotation": 0, "target": "6-" },
        { "yaw": -2.8398592735252883, "pitch": -0.020568961236197225, "rotation": 0, "target": "8-" }
      ],
      "infoHotspots": []
    },
    {
      "id": "8-",
      "name": "云游财专-礼堂中层楼梯",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "pitch": 0, "yaw": 0, "fov": 1.5707963267948966 },
      "linkHotspots": [
        { "yaw": -0.6263479668441185, "pitch": 0.14401632483425786, "rotation": 4.71238898038469, "target": "9-" },
        { "yaw": 0.15736034409026445, "pitch": 0.20076100466063274, "rotation": 0, "target": "5-" },
        { "yaw": 1.7929772872093421, "pitch": -0.056385305637620675, "rotation": 0, "target": "7-" },
        { "yaw": 2.1732798512830884, "pitch": 0.12283952603858594, "rotation": 7.853981633974483, "target": "13-" }
      ],
      "infoHotspots": []
    },
    {
      "id": "9-",
      "name": "云游财专-数智技术服务港",
      "audio": "audio/数智技术服务岗.mp3",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": 0.029983396605254953, "pitch": -0.40801148768754736, "fov": 1.5091423593016802 },
      "linkHotspots": [
        { "yaw": 2.233630541485356, "pitch": 0.09907675305186814, "rotation": 1.5707963267948966, "target": "5-" }
      ],
      "infoHotspots": []
    },
    {
      "id": "10-",
      "name": "云游财专-双创中心",
      "audio": "audio/双创.mp3",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "pitch": 0, "yaw": 0, "fov": 1.5707963267948966 },
      "linkHotspots": [
        { "yaw": -0.06412149728831373, "pitch": 0.051420411119421416, "rotation": 0, "target": "3-" },
        { "yaw": 2.3262166617645805, "pitch": -1.332445437295629, "rotation": 0, "target": "6-" }
      ],
      "infoHotspots": []
    },
    {
      "id": "11-2",
      "name": "云游财专-2号教学楼大厅",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": 0.0788984456380959, "pitch": 0.04044044628123977, "fov": 1.5091423593016802 },
      "linkHotspots": [
        { "yaw": 2.451451414053917, "pitch": 0.1387295485285911, "rotation": 0, "target": "5-" },
        { "yaw": -2.437637480303911, "pitch": -0.006777512204262592, "rotation": 1.5707963267948966, "target": "8-" }
      ],
      "infoHotspots": []
    },
    {
      "id": "12-",
      "name": "云游财专-一站式学生服务社区（学工处）",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": -3.132310139158527, "pitch": 0.11167381334393767, "fov": 1.2078926076094119 },
      "linkHotspots": [
        { "yaw": 0.450965616595699, "pitch": 0.09110973276650824, "rotation": 0, "target": "4-" },
        { "yaw": -0.47157554629367837, "pitch": 0.06744529479757055, "rotation": 4.71238898038469, "target": "5-" }
      ],
      "infoHotspots": []
    },
    {
      "id": "13-",
      "name": "云游财专-南院食堂",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": 3.109840505067888, "pitch": 0.10697029038597883, "fov": 1.5091423593016802 },
      "linkHotspots": [
        { "yaw": 1.2674794947544523, "pitch": 0.01321280177804951, "rotation": 0, "target": "7-" },
        { "yaw": 0.2523889394234544, "pitch": -0.0016533600450472363, "rotation": 0, "target": "8-" }
      ],
      "infoHotspots": []
    },
    {
      "id": "14-",
      "name": "云游财专-东门池塘（小树林）",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": -2.1356767030748145, "pitch": -0.020437917789580595, "fov": 1.5091423593016802 },
      "linkHotspots": [
        { "yaw": -2.336850465999344, "pitch": 0.02341050617294549, "rotation": 0, "target": "5-" },
        { "yaw": 1.1154189470872904, "pitch": 0.09598640107515521, "rotation": 0, "target": "2-" }
      ],
      "infoHotspots": []
    },
    {
      "id": "15-",
      "name": "云游财专-南门树林",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "tileSize": 512, "size": 512 },
        { "tileSize": 512, "size": 1024 },
        { "tileSize": 512, "size": 2048 },
        { "tileSize": 512, "size": 4096 }
      ],
      "faceSize": 4096,
      "initialViewParameters": { "yaw": -0.7660007730783409, "pitch": -0.1777878838957534, "fov": 1.5091423593016802 },
      "linkHotspots": [
        { "yaw": -1.373884775922905, "pitch": -0.027580503962997938, "rotation": 0, "target": "3-" },
        { "yaw": -2.4431806676883774, "pitch": -0.05278911195778235, "rotation": 0, "target": "1-" }
      ],
      "infoHotspots": []
    }
  ],
  "name": "云游财专-山西财专“云上”游校园",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": true,
    "fullscreenButton": true,
    "viewControlButtons": true
  }
};

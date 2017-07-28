import React, { Component } from 'react';

class Origami extends Component {
  componentWillMount() {
    this.currentRAF = null;

    const sidebarWidth = 72;
    const topbarHeight = 42;
    const mobileTopbarHeight = 30;

    this.sidebarWidth = sidebarWidth;
    this.topbarHeight = topbarHeight


    // TODO: de-hardcode values, replace w/ CSS properties
    this.plgram = {
      tl: [85 + sidebarWidth, topbarHeight],
      tr: [222 + sidebarWidth, topbarHeight],
      bl: [0 + sidebarWidth, topbarHeight * 2],
      br: [110 + sidebarWidth, topbarHeight * 2]
    };

    this.mobilePlgram = { 
      tl: [120, mobileTopbarHeight],
      tr: [225, mobileTopbarHeight],
      bl: [78, mobileTopbarHeight + 25],
      br: [143, mobileTopbarHeight + 25]
    };

    this.xOffsetMax = 110;
  }

  pointsToString(points) {
    return points.map((point) => (point[0]  + ',' + point[1])).join(' ');
  }

  offsetPoint(point) {
    const currentXOffset = this.props.menuScalar * this.xOffsetMax;
    return [point[0] + currentXOffset, point[1]];
  }

  getDesktopShapes() {
    const boundOffset = (point) => this.offsetPoint(point);

    // TODO: encode this SVG data more efficiently?
    // it's useful to have points as variables since they'll animate
    const shapes = [
      {
        color: "#412468",
        points: ([
          [this.sidebarWidth, 0],
          [this.sidebarWidth + (85 * 2), 0],
          this.plgram['tl'],
          this.plgram['br'],
          this.plgram['bl']
        ])
      },
      {
        color: '#553580',
        points: ([
          [this.sidebarWidth + (85 * 2), 0],
          this.plgram['tl'],
          this.plgram['tr'],
          [this.sidebarWidth + (85 * 2) + 130, 0],
        ])
      },
      {
        color: "#9592A4",
        points: ([
          this.plgram['tl'],
          this.plgram['bl'],
          this.plgram['br']
        ]).map(boundOffset)
      },
      {
        color: "#C5C3CD",
        points: ([
          this.plgram['tl'],
          this.plgram['tr'],
          this.plgram['br']
        ]).map(boundOffset)
      }
    ];

    if (this.props.menuScalar > 0) {
      shapes.push({
        color: "#5A4774",
        points: [
          this.plgram['tl'],
          boundOffset(this.plgram['bl']),
          boundOffset(this.plgram['tl']),
        ]
      });
    }

    return shapes;
  }

  getMobileShapes() {
    const shapes = [
      {
        color: '#412468',
        points: ([
          [0, 0],
          [190, 0],
          this.mobilePlgram.tl,
          this.mobilePlgram.bl,
          [0, 100]
        ])
      },
      {
        color: '#553580',
        points: ([
          [190, 0],
          this.mobilePlgram.tl,
          this.mobilePlgram.tr,
          [330, 0],
        ])
      },
      {
        color: '#9592A4',
        points: ([
          this.mobilePlgram['tl'],
          this.mobilePlgram['bl'],
          this.mobilePlgram['br']
        ])
      },
      {
        color: '#C5C3CD',
        points: ([
          this.mobilePlgram["tl"],
          this.mobilePlgram["tr"],
          this.mobilePlgram["br"]
        ])
      }
    ];

     return shapes;
  }

  render() {
    let shapes;
    
    if (this.props.isMobile) shapes = this.getMobileShapes();
    else shapes = this.getDesktopShapes();

    const polygons = shapes.map((shape) => {
      const pointString = this.pointsToString(shape.points);
      return (<polygon fill={shape.color} points={pointString} />);
    });

    return (<svg id="paralellogo">{polygons}</svg>);
  }
}

export default Origami;
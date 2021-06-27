import React, { Component } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Animated,
    TouchableOpacity,
    Text as RNText
} from 'react-native';
import * as d3Shape from 'd3-shape';
import color from 'randomcolor';
const knobFill = color({ hue: 'purple' });
import Svg, { G, Text, TSpan, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('screen');
const SPINNER_WIDTH = width;
const SPINNER_HEIGHT = height;
class WheelOfFortune extends Component {
    constructor(props) {
        super(props);
        this.state = {
            enabled: false,
            started: false,
            finished: false,
            winner: null,
            gameScreen: new Animated.Value(SPINNER_WIDTH - 40),
            wheelOpacity: new Animated.Value(1),
            imageLeft: new Animated.Value(SPINNER_WIDTH / 2 - 30),
            imageTop: new Animated.Value(SPINNER_HEIGHT / 2 - 70),
        };
        this.angle = 0;

        this.prepareWheel();
    }

    prepareWheel = () => {
        this.Rewards = this.props.options.rewards;
        this.RewardCount = this.Rewards.length;

        this.numberOfSegments = this.RewardCount;
        this.fontSize = 20;
        this.oneTurn = 360;
        this.angleBySegment = this.oneTurn / this.numberOfSegments;
        this.angleOffset = this.angleBySegment / 2;
        this.winner = this.props.options.winner
            ? this.props.options.winner
            : Math.floor(Math.random() * this.numberOfSegments);

        this.wheelPaths = this.makeWheel();
        this.animatedAngle = new Animated.Value(0);

        this.props.options.onRef(this);
    };

    resetWheelState = () => {
        this.setState({
            enabled: false,
            started: false,
            finished: false,
            winner: null,
            gameScreen: new Animated.Value(SPINNER_WIDTH - 40),
            wheelOpacity: new Animated.Value(1),
            imageLeft: new Animated.Value(SPINNER_WIDTH / 2 - 30),
            imageTop: new Animated.Value(SPINNER_HEIGHT / 2 - 70),
        });
    };

    tryAgain = () => {
        this.prepareWheel();
        this.resetWheelState();
        this.angleListener();
        this.onPress();
    };

    angleListener = () => {
        this.animatedAngle.addListener(event => {
            if (this.state.enabled) {
                this.setState({
                    enabled: false,
                    finished: false,
                });
            }

            this.angle = event.value;
        });
    };

    componentWillUnmount() {
        // this.props.options.onRef(undefined);
    }

    componentDidMount() {
        this.angleListener();
    }

    makeWheel = () => {
        const data = Array.from({ length: this.numberOfSegments }).fill(1);
        const arcs = d3Shape.pie()(data);
        var colors = this.props.options.colors
            ? this.props.options.colors
            : [
                '#E07026',
                '#E8C22E',
                '#ABC937',
                '#4F991D',
                '#22AFD3',
                '#5858D0',
                '#7B48C8',
                '#D843B9',
                '#E23B80',
                '#D82B2B',
            ];
        return arcs.map((arc, index) => {
            const instance = d3Shape
                .arc()
                .padAngle(0.01)
                .outerRadius(SPINNER_WIDTH / 2)
                .innerRadius(this.props.options.innerRadius || 100);
            return {
                path: instance(arc),
                color: colors[index % colors.length],
                value: this.Rewards[index],
                centroid: instance.centroid(arc),
            };
        });
    };

    getWinnerIndex = () => {
        const deg = Math.abs(Math.round(this.angle % this.oneTurn));
        // wheel turning counterclockwise
        if (this.angle < 0) {
            return Math.floor(deg / this.angleBySegment);
        }
        // wheel turning clockwise
        return (
            (this.numberOfSegments - Math.floor(deg / this.angleBySegment)) %
            this.numberOfSegments
        );
    };

    onPress = () => {
        const duration = this.props.options.duration || 10000;
        this.setState({
            started: true,
        });
        Animated.timing(this.animatedAngle, {
            toValue:
                365 -
                this.winner * (this.oneTurn / this.numberOfSegments) +
                360 * (duration / 1000),
            duration: duration,
            useNativeDriver: true,
        }).start(() => {
            const winnerIndex = this.getWinnerIndex();
            this.setState({
                finished: true,
                winner: this.wheelPaths[winnerIndex].value,
            });
            this.props.options.getWinner(this.wheelPaths[winnerIndex].value, winnerIndex);
        });
    };

    textRender = (x, y, number, i) => (
        <Text
            x={x - number.length * 5}
            y={y - 80}
            fill={
                this.props.options.textColor ? this.props.options.textColor : '#fff'
            }
            textAnchor="middle"
            fontSize={this.fontSize}>
            {Array.from({ length: number.length }).map((_, j) => {
                // Render reward text vertically
                if (this.props.options.textAngle === 'vertical') {
                    return (
                        <TSpan x={x} dy={this.fontSize} key={`arc-${i}-slice-${j}`}>
                            {number.charAt(j)}
                        </TSpan>
                    );
                }
                // Render reward text horizontally
                else {
                    return (
                        <TSpan
                            y={y - 40}
                            dx={this.fontSize * 0.07}
                            key={`arc-${i}-slice-${j}`}>
                            {number.charAt(j)}
                        </TSpan>
                    );
                }
            })}
        </Text>
    );

    renderSpinButton = () => {
        return (
            <View style={styles.spinButton} >
                {this.props.options.resetButton ? this.renderResetButton() : null}
            </View>
        )
    }

    renderSvgWheel = () => {
        return (
            <View style={{
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {this.renderKnob()}
                {this.renderSpinButton()}
                <Animated.View
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: [
                            {
                                rotate: this.animatedAngle.interpolate({
                                    inputRange: [-this.oneTurn, 0, this.oneTurn],
                                    outputRange: [
                                        `-${this.oneTurn}deg`,
                                        `0deg`,
                                        `${this.oneTurn}deg`,
                                    ],
                                }),
                            },
                        ],
                        backgroundColor: this.props.options.backgroundColor
                            ? this.props.options.backgroundColor
                            : '#fff',
                        width: SPINNER_WIDTH / 1.8,
                        height: SPINNER_WIDTH / 1.8,
                        borderRadius: (SPINNER_WIDTH) / 1.8,
                        borderWidth: this.props.options.borderWidth
                            ? this.props.options.borderWidth
                            : 2,
                        borderColor: this.props.options.borderColor
                            ? this.props.options.borderColor
                            : Colors.primaryColor,
                        opacity: this.state.wheelOpacity,
                    }}>

                    <Svg
                        width={SPINNER_WIDTH / 1.8}
                        height={SPINNER_WIDTH / 1.8}
                        viewBox={`0 0 ${width} ${width}`}
                        style={{ transform: [{ rotate: `-${this.angleOffset}deg` }] }}
                    >
                        <G y={SPINNER_WIDTH / 2} x={SPINNER_WIDTH / 2}>
                            {this.wheelPaths.map((arc, i) => {
                                const [x, y] = arc.centroid;
                                const number = arc.value.toString();

                                return (
                                    <G key={`arc-${i}`}>
                                        <Path d={arc.path} fill={arc.color} />
                                        <G
                                            rotation={(i * this.oneTurn) / this.numberOfSegments + this.angleOffset}
                                            origin={`${x}, ${y}`}
                                        >
                                            {this.textRender(x, y, number, i)}
                                        </G>
                                    </G>
                                );
                            })}
                        </G>
                    </Svg>

                </Animated.View>
            </View>
        );
    };


    renderKnob = () => {
        const knobSize = 20;
        const YOLO = Animated.modulo(
            Animated.divide(
                Animated.modulo(Animated.subtract(this.animatedAngle, this.angleOffset), this.oneTurn),
                new Animated.Value(this.angleBySegment)
            ),
            1
        );

        return (
            <Animated.View
                style={{
                    width: knobSize,
                    height: knobSize * 2,
                    justifyContent: 'flex-end',
                    zIndex: 1,
                    transform: [
                        {
                            rotate: YOLO.interpolate({
                                inputRange: [-1, -0.5, -0.0001, 0.0001, 0.5, 1],
                                outputRange: ['0deg', '0deg', '35deg', '-35deg', '0deg', '0deg']
                            })
                        }
                    ]
                }}>

                <Svg
                    width={knobSize}
                    height={(knobSize * 100) / 57}
                    viewBox={`0 0 57 100`}
                    style={{ transform: [{ translateY: 8 }] }}
                >
                    <Path
                        d="M28.034,0C12.552,0,0,12.552,0,28.034S28.034,100,28.034,100s28.034-56.483,28.034-71.966S43.517,0,28.034,0z   M28.034,40.477c-6.871,0-12.442-5.572-12.442-12.442c0-6.872,5.571-12.442,12.442-12.442c6.872,0,12.442,5.57,12.442,12.442  C40.477,34.905,34.906,40.477,28.034,40.477z"
                        fill={knobFill}
                    />
                </Svg>
            </Animated.View>
        );
    };

    renderTopToPlay() {
        if (this.state.started == false) {
            return (
                <TouchableOpacity onPress={() => this.onPress()}>
                    {this.props.options.playButton()}
                </TouchableOpacity>
            );
        }
    }

    renderResetButton = () => {
        return (
            <TouchableOpacity onPress={() => this.tryAgain()}>
                {this.props.options.resetButton()}
            </TouchableOpacity>
        );
    }

    render() {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.wheelContainer}>
                    <Animated.View style={[styles.content]}>
                        {this.renderSvgWheel()}
                    </Animated.View>
                </TouchableOpacity>
            </View>
        );
    }
}

export default WheelOfFortune;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {},
    startText: {
        fontSize: 50,
        color: '#fff',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    spinButton: {
        position: 'absolute',
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        top: 20
    },
    wheelContainer: {
        width: SPINNER_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

import React, { Component, createRef } from "react";
import { render } from "react-dom";
import Karuseru from "../../src";
import "./styles.css";

const imgs = [
  'https://images.pexels.com/photos/5439/earth-space.jpg?auto=compress&cs=tinysrgb&dpr=2&h=350',
  'https://images.pexels.com/photos/1434608/pexels-photo-1434608.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=350',
  'https://images.pexels.com/photos/733475/pexels-photo-733475.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=350',
];

class App extends Component {
  carousel = createRef();

  state = {
    slide: 0,
    hasNext: true,
    hasPrev: false,
  };

  next = () => {
    this.carousel.current.next();
  }

  prev = () => {
    this.carousel.current.prev();
  }

  onChange = ({ slide, length }) => {
    this.setState({
      slide,
      hasNext: slide < length - 1,
      hasPrev: slide > 0,
    });
  }

  render() {
    const { slide, hasNext, hasPrev } = this.state;

    return (
      <div style={{
        width: '100%',
        maxWidth: 640,
        margin: '0 auto',
      }}>
        <div className="wrap">
          <Karuseru ref={this.carousel} slide={slide} onChange={this.onChange}>
            {imgs.map((src) => (
              <div key={src} className="slide">
                <div className="card">
                  <div className="card_media img">
                    <img src={src} alt="space stuff" draggable="false" />
                  </div>
                  <div className="card_body">
                    <h2>space stuff</h2>
                  </div>
                </div>
              </div>
            ))}
          </Karuseru>
        </div>
        <div>
          <button onClick={this.prev} disabled={!hasPrev}>&lt;</button>
          <button onClick={this.next} disabled={!hasNext}>&gt;</button>
        </div>
      </div>
    );
  }
}

render(<App />, document.getElementById("root"));

interface Props {
    title: string;
    width: number;
    height: number;
    thickness: number;
}

/**
 * A component to render the DeviceBoxes that surround the exchanged messages.
 *
 * @param props The title, width, height, and line thickness of the boxes.
 */
function DeviceBox(props: Props) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    width: `${props.thickness}px`,
                    height: `${props.height}px`,
                    background: "black",
                    marginBottom: "10px",
                }}
            />
            <p
                style={{
                    border: `${props.thickness}px solid black`,
                    padding: props.width+"px",
                    textAlign: "center",
                    fontSize: "1.25em",
                    fontWeight: "bold",
                    backgroundColor: "lightgray"
                }}
            >
                {props.title}
            </p>
        </div>
    );
}

export default DeviceBox;
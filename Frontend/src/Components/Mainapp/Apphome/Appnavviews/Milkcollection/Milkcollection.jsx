import CollectionSettingForm from "./CollectionSettingForm";
import Milkcollelist from "./Milkcollelist";
import "../../../../../Styles/Mainapp/Apphome/Appnavview/Milkcollection.css";
const Milkcollection = ({ times }) => {
  return (
    <div className="milk-collection-container w100 h1 p10">
      <div className="milk-form-list-container w100 h1 d-flex sa">
        <div className="milk-collection-form w60 ">
          <CollectionSettingForm times={times} />
        </div>
        <div className="milk-coll-list-div w40 h1 mx10">
          <Milkcollelist times={times} />
        </div>
      </div>
    </div>
  );
};

export default Milkcollection;

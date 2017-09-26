/* eslint react/no-array-index-key: 0 */  // It's OK in this specific instance as order remains the same

import React, { Component } from 'react'
import PropTypes from 'prop-types'
// import classNames from 'classnames'

// import CreateMarketFormType from 'modules/create-market/components/create-market-form-type'
// import CreateMarketFormDescription from 'modules/create-market/components/create-market-form-description/create-market-form-description'
// import CreateMarketFormOutcomes from 'modules/create-market/components/create-market-form-outcomes'
// import CreateMarketFormExpirySource from 'modules/create-market/components/create-market-form-expiry-source'
// import CreateMarketFormEndDate from 'modules/create-market/components/create-market-form-end-date'
// import CreateMarketFormDetails from 'modules/create-market/components/create-market-form-details'
// import CreateMarketFormTopic from 'modules/create-market/components/create-market-form-topic'
// import CreateMarketFormKeywords from 'modules/create-market/components/create-market-form-keywords'
// import CreateMarketFormFees from 'modules/create-market/components/create-market-form-fees'
// import CreateMarketFormOrderBook from 'modules/create-market/components/create-market-form-order-book'
// import CreateMarketReview from 'modules/create-market/components/create-market-review'

// import CreateMarketFormInputNotifications from 'modules/create-market/components/create-market-form-input-notifications'

// import newMarketCreationOrder from 'modules/create-market/constants/new-market-creation-order'
// import { NEW_MARKET_DESCRIPTION } from 'modules/create-market/constants/new-market-creation-steps'
import { DESCRIPTION_MAX_LENGTH, TAGS_MAX_LENGTH } from 'modules/create-market/constants/new-market-constraints'

// import newMarketCreationOrder from 'modules/create-market/constants/new-market-creation-order'
// import {
//   NEW_MARKET_TYPE,
//   NEW_MARKET_DESCRIPTION,
//   NEW_MARKET_OUTCOMES,
//   NEW_MARKET_EXPIRY_SOURCE,
//   NEW_MARKET_END_DATE,
//   NEW_MARKET_DETAILS,
//   NEW_MARKET_TOPIC,
//   NEW_MARKET_KEYWORDS,
//   NEW_MARKET_FEES,
//   NEW_MARKET_ORDER_BOOK,
//   NEW_MARKET_REVIEW
// } from 'modules/create-market/constants/new-market-creation-steps'

// import debounce from 'utils/debounce'

import Styles from 'modules/create-market/components/create-market-form/create-market-form.styles'

export default class CreateMarketForm extends Component {

  static propTypes = {
    newMarket: PropTypes.object.isRequired,
    updateNewMarket: PropTypes.func.isRequired,
    categories: PropTypes.array.isRequired
  }

  constructor(props) {
    super(props)

    // this.state = {
    //   lastStep: props.newMarket.currentStep,
    //   currentStep: props.newMarket.currentStep
    // }

    this.state = {
      suggestedCategories: this.filterCategories(this.props.newMarket.category),
      shownSuggestions: 2,
      requiredFields: Array(4).fill(false)
    }

    this.validateField = this.validateField.bind(this)
    this.filterCategories = this.filterCategories.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.newMarket.category !== nextProps.newMarket.category) {
      this.setState({ suggestedCategories: this.filterCategories(nextProps.newMarket.category) })
      if (nextProps.newMarket.category === '' || this.props.newMarket.category.slice(0, 1) !== nextProps.newMarket.category.slice(0, 1)) {
        this.setState({ shownSuggestions: 2 })
      }
    }
  }

  // componentWillReceiveProps(nextProps) {
  //   if (this.props.newMarket.currentStep !== nextProps.newMarket.currentStep) {
  //     this.setState({
  //       lastStep: this.props.newMarket.currentStep,
  //       currentStep: nextProps.newMarket.currentStep
  //     }, () => {
  //       this.updateFormHeight()
  //     })
  //   }
  // }

  filterCategories(category) {
    const userString = category.toLowerCase()
    return this.props.categories.filter(cat => cat.topic.toLowerCase().indexOf(userString) === 0)
  }

  validateField(fieldKey, fieldName, value, maxLength) {
    const requiredFields = this.state.requiredFields

    if (!value.length) {
      requiredFields[fieldKey] = 'This field is required.'
      this.setState({ requiredFields })
      return
    }

    if (value.length > maxLength) {
      requiredFields[fieldKey] = `Maximum length is ${maxLength}`
      this.setState({ requiredFields })
      return
    }

    requiredFields[fieldKey] = true
    this.setState({ requiredFields })

    this.props.updateNewMarket({ [fieldName]: value })
  }

  render() {
    const p = this.props
    const s = this.state

    return (
      <article className={Styles.CreateMarketForm}>
        {/* <article
        ref={(createMarketForm) => { this.createMarketForm = createMarketForm }}
        className={classNames('create-market-form', {
          'no-preview': s.currentStep === 0
        })}
      > */}
        <ul className={Styles.CreateMarketForm__fields}>
          <li>
            <label htmlFor="cm__input--desc">
              <span>Market Question</span>
              { s.requiredFields[0].length && <span className={Styles.CreateMarketForm__error}>{ s.requiredFields[0] }</span> }
            </label>
            <input
              id="cm__input--desc"
              type="text"
              maxLength={DESCRIPTION_MAX_LENGTH}
              placeholder="What question do you want the world to predict?"
              onChange={e => this.validateField(0, 'description', e.target.value, DESCRIPTION_MAX_LENGTH)}
            />
          </li>
          <li className={Styles['field--50']}>
            <label htmlFor="cm__input--cat">
              <span>Category</span>
              { s.requiredFields[1].length && <span className={Styles.CreateMarketForm__error}>{ s.requiredFields[1] }</span> }
            </label>
            <input
              className={Styles.CreateMarketFormDesc__input}
              ref={catInput => { this.catInput = catInput }}
              id="cm__input--cat"
              type="text"
              maxLength={TAGS_MAX_LENGTH}
              placeholder="Help users find your market by defining its category"
              onChange={e => this.validateField(1, 'category', e.target.value, TAGS_MAX_LENGTH)}
            />
          </li>
          <li className={Styles['field--50']}>
            <label htmlFor="cm__suggested-categories">
              <span>Suggested Categories</span>
            </label>
            <ul className={Styles['CreateMarketForm__suggested-categories']}>
              {p.newMarket.category && s.suggestedCategories.slice(0, s.shownSuggestions).map((cat, i) => (
                <li key={i}>
                  <button onClick={() => { this.catInput.value = cat.topic; this.validateField(1, 'category', cat.topic, TAGS_MAX_LENGTH) }}>{cat.topic}</button>
                </li>
                )
              )}
              {p.newMarket.category && s.suggestedCategories.length > s.shownSuggestions &&
                <li>
                  <button onClick={() => this.setState({ shownSuggestions: s.suggestedCategories.length })}>+ {s.suggestedCategories.length - 2} more</button>
                </li>
              }
            </ul>
          </li>
          <li className={Styles['field--50']}>
            <label htmlFor="cm__input--tag1">
              <span>Tags:</span>
              { s.requiredFields[2].length && <span className={Styles.CreateMarketForm__error}>{ s.requiredFields[2] }</span> }
            </label>
            <input
              id="cm__input--tag1"
              className={Styles.CreateMarketFormDesc__input}
              type="text"
              maxLength={TAGS_MAX_LENGTH}
              placeholder="Tag 1"
              onChange={e => this.validateField(2, 'tag1', e.target.value, TAGS_MAX_LENGTH)}
            />
          </li>
          <li className={Styles['field--50']}>
            <label htmlFor="cm__input--tag2">
              { s.requiredFields[3].length && <span className={Styles.CreateMarketForm__error}>{ s.requiredFields[3] }</span> }
              <span>&nbsp;</span>
            </label>
            <input
              id="cm__input--tag2"
              className={Styles.CreateMarketFormDesc__input}
              type="text"
              maxLength={TAGS_MAX_LENGTH}
              placeholder="Tag 2"
              onChange={e => this.validateField(3, 'tag2', e.target.value, TAGS_MAX_LENGTH)}
            />
          </li>
        </ul>
        <button className={Styles.CreateMarketForm__next} disabled={!s.requiredFields.every(field => field === true)}>Next: Outcome</button>
        {/* <CreateMarketFormDescription
          className={classNames({
            'display-form-part': s.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_DESCRIPTION),
            'hide-form-part': s.currentStep !== newMarketCreationOrder.indexOf(NEW_MARKET_DESCRIPTION) && s.lastStep === newMarketCreationOrder.indexOf(NEW_MARKET_DESCRIPTION)
          })}
          currentStep={p.newMarket.currentStep}
          description={p.newMarket.description}
          updateValidity={this.updateValidity}
          updateNewMarket={p.updateNewMarket}
        />
        <CreateMarketFormType
          className={classNames({
            'can-hide': s.currentStep >= newMarketCreationOrder.indexOf(NEW_MARKET_TYPE) + 1,
            display: s.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_TYPE) && s.lastStep > newMarketCreationOrder.indexOf(NEW_MARKET_TYPE),
            hide: s.currentStep > newMarketCreationOrder.indexOf(NEW_MARKET_TYPE) && s.lastStep === newMarketCreationOrder.indexOf(NEW_MARKET_TYPE),
          })}
          type={p.newMarket.type}
          addValidationToNewMarket={p.addValidationToNewMarket}
          removeValidationFromNewMarket={p.removeValidationFromNewMarket}
          updateNewMarket={p.updateNewMarket}
        />
        <CreateMarketFormOutcomes
          className={classNames({
            'display-form-part': s.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_OUTCOMES),
            'hide-form-part': s.currentStep !== newMarketCreationOrder.indexOf(NEW_MARKET_OUTCOMES) && s.lastStep === newMarketCreationOrder.indexOf(NEW_MARKET_OUTCOMES)
          })}
          type={p.newMarket.type}
          outcomes={p.newMarket.outcomes}
          scalarSmallNum={p.newMarket.scalarSmallNum}
          scalarBigNum={p.newMarket.scalarBigNum}
          currentStep={p.newMarket.currentStep}
          updateValidity={this.updateValidity}
          updateNewMarket={p.updateNewMarket}
        />
        <CreateMarketFormExpirySource
          className={classNames({
            'display-form-part': s.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_EXPIRY_SOURCE),
            'hide-form-part': s.currentStep !== newMarketCreationOrder.indexOf(NEW_MARKET_EXPIRY_SOURCE) && s.lastStep === newMarketCreationOrder.indexOf(NEW_MARKET_EXPIRY_SOURCE)
          })}
          currentStep={p.newMarket.currentStep}
          expirySourceType={p.newMarket.expirySourceType}
          expirySource={p.newMarket.expirySource}
          updateValidity={this.updateValidity}
          updateNewMarket={p.updateNewMarket}
        />
        {
          s.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_END_DATE) &&
            <CreateMarketFormEndDate
              className={classNames({
                'display-form-part': s.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_END_DATE),
                'hide-form-part': s.currentStep !== newMarketCreationOrder.indexOf(NEW_MARKET_END_DATE) && s.lastStep === newMarketCreationOrder.indexOf(NEW_MARKET_END_DATE)
              })}
              currentStep={p.newMarket.currentStep}
              isValid={p.newMarket.isValid}
              endDate={p.newMarket.endDate}
              updateFormHeight={this.updateFormHeight}
              updateValidity={this.updateValidity}
              updateNewMarket={p.updateNewMarket}
            />
        }
        <CreateMarketFormDetails
          className={classNames({
            'display-form-part': s.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_DETAILS),
            'hide-form-part': s.currentStep !== newMarketCreationOrder.indexOf(NEW_MARKET_DETAILS) && s.lastStep === newMarketCreationOrder.indexOf(NEW_MARKET_DETAILS)
          })}
          isValid={p.newMarket.isValid}
          currentStep={p.newMarket.currentStep}
          detailsText={p.newMarket.detailsText}
          validations={p.newMarket.validations}
          updateValidity={this.updateValidity}
          updateNewMarket={p.updateNewMarket}
        />
        <CreateMarketFormTopic
          className={classNames({
            'display-form-part': s.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_TOPIC),
            'hide-form-part': s.currentStep !== newMarketCreationOrder.indexOf(NEW_MARKET_TOPIC) && s.lastStep === newMarketCreationOrder.indexOf(NEW_MARKET_TOPIC)
          })}
          topic={p.newMarket.topic}
          keywords={p.newMarket.keywords}
          currentStep={p.newMarket.currentStep}
          updateValidity={this.updateValidity}
          updateNewMarket={p.updateNewMarket}
        />
        <CreateMarketFormKeywords
          className={classNames({
            'display-form-part': s.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_KEYWORDS),
            'hide-form-part': s.currentStep !== newMarketCreationOrder.indexOf(NEW_MARKET_KEYWORDS) && s.lastStep === newMarketCreationOrder.indexOf(NEW_MARKET_KEYWORDS)
          })}
          isValid={p.newMarket.isValid}
          currentStep={p.newMarket.currentStep}
          keywords={p.newMarket.keywords}
          topic={p.newMarket.topic}
          validations={p.newMarket.validations}
          updateValidity={this.updateValidity}
          updateNewMarket={p.updateNewMarket}
        />
        <CreateMarketFormFees
          className={classNames({
            'display-form-part': s.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_FEES),
            'hide-form-part': s.currentStep !== newMarketCreationOrder.indexOf(NEW_MARKET_FEES) && s.lastStep === newMarketCreationOrder.indexOf(NEW_MARKET_FEES)
          })}
          currentStep={p.newMarket.currentStep}
          settlementFee={p.newMarket.settlementFee}
          makerFee={p.newMarket.makerFee}
          updateValidity={this.updateValidity}
          updateNewMarket={p.updateNewMarket}
        />
        <CreateMarketFormOrderBook
          className={classNames({
            'display-form-part': s.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_ORDER_BOOK),
            'hide-form-part': s.currentStep !== newMarketCreationOrder.indexOf(NEW_MARKET_ORDER_BOOK) && s.lastStep === newMarketCreationOrder.indexOf(NEW_MARKET_ORDER_BOOK)
          })}
          isValid={p.newMarket.isValid}
          availableEth={p.availableEth}
          type={p.newMarket.type}
          currentStep={p.newMarket.currentStep}
          outcomes={p.newMarket.outcomes}
          orderBook={p.newMarket.orderBook}
          orderBookSorted={p.newMarket.orderBookSorted}
          orderBookSeries={p.newMarket.orderBookSeries}
          scalarBigNum={p.newMarket.scalarBigNum}
          scalarSmallNum={p.newMarket.scalarSmallNum}
          makerFee={p.newMarket.makerFee}
          initialLiquidityEth={p.newMarket.initialLiquidityEth}
          initialLiquidityGas={p.newMarket.initialLiquidityGas}
          initialLiquidityFees={p.newMarket.initialLiquidityFees}
          addOrderToNewMarket={p.addOrderToNewMarket}
          removeOrderFromNewMarket={p.removeOrderFromNewMarket}
          updateValidity={this.updateValidity}
          updateNewMarket={p.updateNewMarket}
        />
        <CreateMarketReview
          className={classNames({
            'display-form-part': s.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_REVIEW),
            'hide-form-part': s.currentStep !== newMarketCreationOrder.indexOf(NEW_MARKET_REVIEW) && s.lastStep === newMarketCreationOrder.indexOf(NEW_MARKET_ORDER_BOOK)
          })}
          isValid={p.newMarket.isValid}
          creationError={p.newMarket.creationError}
          endDate={p.newMarket.endDate}
          branch={p.branch}
          currentStep={p.newMarket.currentStep}
          settlementFee={p.newMarket.settlementFee}
          makerFee={p.newMarket.makerFee}
          initialLiquidityEth={p.newMarket.initialLiquidityEth}
          initialLiquidityGas={p.newMarket.initialLiquidityGas}
          initialLiquidityFees={p.newMarket.initialLiquidityFees}
        /> */}
      </article>
    )
  }
}